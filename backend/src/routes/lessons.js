import { Router } from 'express';
import { Lesson } from '../models/Lesson.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// POST /api/lessons — створити/оновити заняття (викладач або адміністратор).
// Тіло: { group, date, records: [{ student, present, grade }] }
// Одне заняття на групу в день: якщо вже існує — оновлюється (upsert).
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  const { group, date } = req.body;
  const lesson = await Lesson.findOneAndUpdate(
    { group, date },
    req.body,
    { new: true, upsert: true },
  );
  res.status(201).json(lesson);
});

// DELETE /api/lessons/:id — видалити заняття (викладач або адміністратор).
router.delete('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  await Lesson.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
