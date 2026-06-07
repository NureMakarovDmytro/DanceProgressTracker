import mongoose from 'mongoose';

// Користувач системи: адміністратор або викладач.
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher'], required: true },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
