import mongoose from 'mongoose';

// Учень, прикріплений до групи.
const studentSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
}, { timestamps: true });

export const Student = mongoose.model('Student', studentSchema);
