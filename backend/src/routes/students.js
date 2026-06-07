import { Router } from 'express';
import { Student } from '../models/Student.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// POST /api/students — додавання учня до групи (адміністратор).
router.post('/', requireRole('admin'), async (req, res) => {
  const student = await Student.create(req.body);
  res.status(201).json(student);
});

// PUT /api/students/:id — редагування учня.
router.put('/:id', requireRole('admin'), async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(student);
});

// DELETE /api/students/:id — видалення учня.
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
