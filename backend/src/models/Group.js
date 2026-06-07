import mongoose from 'mongoose';

// Танцювальна група (за стилем та рівнем).
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  style: { type: String, default: '' },
  level: { type: String, default: '' },
}, { timestamps: true });

export const Group = mongoose.model('Group', groupSchema);
