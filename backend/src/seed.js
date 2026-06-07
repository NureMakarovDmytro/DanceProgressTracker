// Наповнення бази демонстраційними даними: запуск `npm run seed`.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User } from './models/User.js';
import { Group } from './models/Group.js';
import { Student } from './models/Student.js';
import { Lesson } from './models/Lesson.js';

async function seed() {
  await mongoose.connect(config.mongoUri);
  await Promise.all([
    User.deleteMany({}), Group.deleteMany({}), Student.deleteMany({}), Lesson.deleteMany({}),
  ]);

  await User.create([
    { username: 'admin', passwordHash: bcrypt.hashSync('admin', 10), name: 'Адміністратор', role: 'admin' },
    { username: 'teacher', passwordHash: bcrypt.hashSync('teacher', 10), name: 'Олена Викладач', role: 'teacher' },
  ]);

  const group = await Group.create({ name: 'Hip-Hop A', style: 'Hip-Hop', level: 'Початковий' });
  const students = await Student.create([
    { group: group._id, lastName: 'Коваль', firstName: 'Іван' },
    { group: group._id, lastName: 'Шевченко', firstName: 'Марія' },
    { group: group._id, lastName: 'Бондар', firstName: 'Олег' },
  ]);

  await Lesson.create({
    group: group._id,
    date: '2026-06-01',
    records: [
      { student: students[0]._id, present: true, grade: 10 },
      { student: students[1]._id, present: true, grade: 12 },
      { student: students[2]._id, present: false, grade: null },
    ],
  });

  console.log('Seed done');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
