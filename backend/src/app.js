import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import studentRoutes from './routes/students.js';
import lessonRoutes from './routes/lessons.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Health-check для load balancer-а та Kubernetes-проб.
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/lessons', lessonRoutes);
  app.use('/api/admin', adminRoutes);

  return app;
}
