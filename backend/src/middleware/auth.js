import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Перевірка JWT-токена з заголовка Authorization: Bearer <token>.
export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Обмеження доступу за роллю. Можна передати кілька ролей:
// requireRole('admin') або requireRole('admin', 'teacher').
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
