import { Router } from 'express';
import { Group } from '../models/Group.js';
import { Student } from '../models/Student.js';
import { Lesson } from '../models/Lesson.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/groups — перелік усіх груп.
router.get('/', async (req, res) => {
  res.json(await Group.find().sort('name'));
});

// POST /api/groups — створення групи (лише адміністратор).
router.post('/', requireRole('admin'), async (req, res) => {
  const group = await Group.create(req.body);
  res.status(201).json(group);
});

// PUT /api/groups/:id — редагування групи.
router.put('/:id', requireRole('admin'), async (req, res) => {
  const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(group);
});

// DELETE /api/groups/:id — видалення групи разом з учнями та заняттями.
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await Group.findByIdAndDelete(req.params.id);
  await Student.deleteMany({ group: req.params.id });
  await Lesson.deleteMany({ group: req.params.id });
  res.status(204).end();
});

// GET /api/groups/:id/students — учні групи.
router.get('/:id/students', async (req, res) => {
  res.json(await Student.find({ group: req.params.id }).sort('lastName'));
});

// GET /api/groups/:id/lessons — заняття групи.
router.get('/:id/lessons', async (req, res) => {
  res.json(await Lesson.find({ group: req.params.id }).sort('date'));
});

// GET /api/groups/:id/stats — пропуски та середній бал кожного учня.
router.get('/:id/stats', async (req, res) => {
  const students = await Student.find({ group: req.params.id });
  const lessons = await Lesson.find({ group: req.params.id });
  const stats = students.map((s) => {
    let absences = 0;
    const grades = [];
    for (const lesson of lessons) {
      const rec = lesson.records.find((r) => String(r.student) === String(s._id));
      if (!rec) continue;
      if (!rec.present) absences += 1;
      if (rec.grade != null) grades.push(rec.grade);
    }
    const average = grades.length
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100
      : null;
    return { studentId: s._id, lastName: s.lastName, firstName: s.firstName, absences, average };
  });
  res.json(stats);
});

export default router;
