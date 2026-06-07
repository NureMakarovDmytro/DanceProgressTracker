import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  const app = createApp();
  app.listen(config.port, () => console.log(`API on :${config.port}`));
}

start().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
