import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Year, Semester, Subject, Student } from './models/index.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance_management');
await Promise.all([Year.deleteMany({}), Semester.deleteMany({}), Subject.deleteMany({}), Student.deleteMany({})]);
await User.updateOne(
  { email: 'admin@attendly.edu' },
  { $setOnInsert: { name: 'Admin User', email: 'admin@attendly.edu', password: await bcrypt.hash('admin123', 10), role: 'admin' } },
  { upsert: true }
);
const years = await Year.insertMany(['1st Year', '2nd Year', '3rd Year'].map((name) => ({ name })));
const semesterNames = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'];
const semesters = await Semester.insertMany(semesterNames.map((name, index) => ({ name, yearId: years[Math.floor(index / 2)]._id })));
const subjects = await Subject.insertMany([
  { code: 'BCA101', name: 'Programming Fundamentals', batchName: 'General', yearId: years[0]._id, semesterId: semesters[0]._id, type: 'Theory', facultyName: 'Dr. Meera Shah' },
  { code: 'BCA102P', name: 'Computer System Architecture Lab', batchName: 'Batch 1', yearId: years[0]._id, semesterId: semesters[0]._id, type: 'Practical', facultyName: 'Ashish Mishra' },
  { code: 'BCA102P', name: 'Computer System Architecture Lab', batchName: 'Batch 2', yearId: years[0]._id, semesterId: semesters[0]._id, type: 'Practical', facultyName: 'Abhishek Pandey' },
  { code: 'BCA201', name: 'Data Structures', batchName: 'General', yearId: years[1]._id, semesterId: semesters[2]._id, type: 'Theory', facultyName: 'Dr. Meera Shah' }
]);
await Student.insertMany([
  { name: 'Rahul Sharma', crNo: '101', batchName: 'Batch 1', yearId: years[0]._id, semesterId: semesters[0]._id }, { name: 'Amit Verma', crNo: '102', batchName: 'Batch 1', yearId: years[0]._id, semesterId: semesters[0]._id },
  { name: 'Priya Nair', crNo: '103', batchName: 'Batch 2', yearId: years[0]._id, semesterId: semesters[0]._id }, { name: 'Sana Khan', crNo: '104', batchName: 'Batch 2', yearId: years[0]._id, semesterId: semesters[0]._id },
  { name: 'Neha Joshi', crNo: '105', batchName: 'Batch 1', yearId: years[0]._id, semesterId: semesters[0]._id }, { name: 'Vikram Singh', crNo: '106', batchName: 'Batch 2', yearId: years[0]._id, semesterId: semesters[0]._id },
  { name: 'Karan Patel', crNo: '107', batchName: 'Batch 1', yearId: years[0]._id, semesterId: semesters[0]._id }, { name: 'Isha Kapoor', crNo: '108', batchName: 'Batch 2', yearId: years[0]._id, semesterId: semesters[0]._id },
  { name: 'Rohan Mehta', crNo: '201', batchName: 'General', yearId: years[1]._id, semesterId: semesters[2]._id }, { name: 'Ananya Das', crNo: '202', batchName: 'General', yearId: years[1]._id, semesterId: semesters[2]._id }
]);
console.log(`Seeded ${years.length} years, ${semesters.length} semesters, ${subjects.length} subjects.`); await mongoose.disconnect();
