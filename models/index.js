import mongoose from 'mongoose';

const { Schema } = mongoose;
const status = { type: String, enum: ['Active', 'Inactive'], default: 'Active' };

export const User = mongoose.model('User', new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, role: { type: String, enum: ['admin', 'faculty'], default: 'faculty' }
}, { timestamps: true }));
export const Year = mongoose.model('Year', new Schema({ name: { type: String, required: true, unique: true, trim: true }, status }, { timestamps: true }));
export const Semester = mongoose.model('Semester', new Schema({ name: { type: String, required: true }, yearId: { type: Schema.Types.ObjectId, ref: 'Year', required: true }, status }, { timestamps: true }));
Semester.schema.index({ name: 1, yearId: 1 }, { unique: true });
export const Subject = mongoose.model('Subject', new Schema({
  code: { type: String, required: true, uppercase: true, trim: true }, name: { type: String, required: true }, courseName: { type: String, default: 'BCA', trim: true }, batchName: { type: String, default: 'General', trim: true },
  yearId: { type: Schema.Types.ObjectId, ref: 'Year', required: true }, semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  type: { type: String, enum: ['Theory', 'Practical'], default: 'Theory' }, facultyName: { type: String, required: true }, status
}, { timestamps: true }));
Subject.schema.index({ code: 1, batchName: 1 }, { unique: true });
export const Student = mongoose.model('Student', new Schema({
  name: { type: String, required: true }, crNo: { type: String, required: true, unique: true, trim: true }, courseName: { type: String, default: 'BCA', trim: true }, batchName: { type: String, default: 'General', trim: true },
  yearId: { type: Schema.Types.ObjectId, ref: 'Year', required: true }, semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true }, status
}, { timestamps: true }));
export const Attendance = mongoose.model('Attendance', new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true }, subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  courseName: { type: String, default: 'BCA', trim: true }, batchName: { type: String, default: 'General', trim: true },
  yearId: { type: Schema.Types.ObjectId, ref: 'Year', required: true }, semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  date: { type: Date, required: true }, status: { type: String, enum: ['Present', 'Absent'], required: true }, remarks: { type: String, default: '' }
}, { timestamps: true }));
Attendance.schema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });
