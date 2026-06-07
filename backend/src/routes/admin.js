import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { Student } from '../models/Student.js';
import { Lesson } from '../models/Lesson.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(auth, requireRole('admin'));

// --- Управління користувачами ---

// GET /api/admin/users — перелік користувачів (без хешів паролів).
router.get('/users', async (req, res) => {
  res.json(await User.find().select('-passwordHash').sort('name'));
});

// POST /api/admin/users — створення користувача.
router.post('/users', async (req, res) => {
  const { username, password, name, role } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await User.create({ username, passwordHash, name, role });
  res.status(201).json({ id: user._id, username, name, role });
});

// DELETE /api/admin/users/:id — видалення користувача.
router.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// --- Резервна копія / експорт-імпорт даних ---

// GET /api/admin/backup — повний дамп даних у форматі JSON.
router.get('/backup', async (req, res) => {
  const [groups, students, lessons] = await Promise.all([
    Group.find().lean(), Student.find().lean(), Lesson.find().lean(),
  ]);
  res.json({ version: 1, exportedAt: new Date().toISOString(), groups, students, lessons });
});

// POST /api/admin/restore — відновлення даних з резервної копії.
router.post('/restore', async (req, res) => {
  const { groups = [], students = [], lessons = [] } = req.body;
  await Promise.all([Group.deleteMany({}), Student.deleteMany({}), Lesson.deleteMany({})]);
  await Group.insertMany(groups);
  await Student.insertMany(students);
  await Lesson.insertMany(lessons);
  res.json({ restored: { groups: groups.length, students: students.length, lessons: lessons.length } });
});

// GET /api/admin/report.csv — зведений звіт по всіх групах у CSV.
router.get('/report.csv', async (req, res) => {
  const groups = await Group.find();
  const rows = ['group,lastName,firstName,absences,average'];
  for (const g of groups) {
    const students = await Student.find({ group: g._id });
    const lessons = await Lesson.find({ group: g._id });
    for (const s of students) {
      let absences = 0;
      const grades = [];
      for (const lesson of lessons) {
        const rec = lesson.records.find((r) => String(r.student) === String(s._id));
        if (!rec) continue;
        if (!rec.present) absences += 1;
        if (rec.grade != null) grades.push(rec.grade);
      }
      const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : '';
      rows.push(`${g.name},${s.lastName},${s.firstName},${absences},${avg}`);
    }
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
  res.send(rows.join('\n'));
});

export default router;
