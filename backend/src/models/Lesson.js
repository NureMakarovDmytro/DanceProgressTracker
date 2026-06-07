import mongoose from 'mongoose';

// Запис відвідуваності/оцінки одного учня на занятті.
const recordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  present: { type: Boolean, default: false },
  grade: { type: Number, min: 1, max: 12, default: null },
}, { _id: false });

// Заняття групи в конкретну дату з переліком записів по учнях.
const lessonSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  records: [recordSchema],
}, { timestamps: true });

export const Lesson = mongoose.model('Lesson', lessonSchema);
