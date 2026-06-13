// Горизонтальне масштабування локально, без Docker/Kubernetes.
// Запускає WORKERS однакових копій (stateless) сервера на ОДНОМУ порту;
// ядро ОС розподіляє з'єднання між ними (round-robin) — це і є scale-out.
//
// Запуск:
//   WORKERS=1 node src/cluster.js     # 1 копія
//   WORKERS=4 node src/cluster.js     # 4 копії
//
// Демонструє: зі збільшенням кількості копій зростає кількість запитів/с,
// які витримує система (поки не вичерпаються ядра CPU або БД).
import cluster from 'node:cluster';
import os from 'node:os';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';

const WORKERS = Number(process.env.WORKERS || os.cpus().length);

if (cluster.isPrimary) {
  console.log(`Головний процес ${process.pid}: запускаю ${WORKERS} копій сервера на :${config.port}`);
  for (let i = 0; i < WORKERS; i++) cluster.fork();
  cluster.on('exit', (worker) => console.log(`Копія ${worker.process.pid} завершилась`));
} else {
  // Кожна копія підключається до спільної БД і слухає той самий порт.
  mongoose.connect(config.mongoUri)
    .then(() => createApp().listen(config.port,
      () => console.log(`Копія ${process.pid} слухає :${config.port}`)))
    .catch((err) => { console.error('Помилка запуску копії:', err.message); process.exit(1); });
}
