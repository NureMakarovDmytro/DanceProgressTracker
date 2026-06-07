import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config.js';

const router = Router();

// POST /api/auth/login — вхід за логіном і паролем, повертає JWT.
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Невірний логін або пароль' });
  }
  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
});

export default router;
