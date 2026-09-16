import { Router } from 'express';
import { Attendance } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = Router(); router.use(auth);
const range = (query) => { const filter = {}; if (query.yearId) filter.yearId = query.yearId; if (query.semesterId) filter.semesterId = query.semesterId; if (query.subjectId) filter.subjectId = query.subjectId; if (query.month) { const [year, month] = query.month.split('-').map(Number); filter.date = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) }; } return filter; };
router.get('/summary', async (req, res, next) => { try {
  const rows = await Attendance.find(range(req.query)).populate('studentId subjectId yearId semesterId'); const byStudent = new Map();
  rows.forEach((row) => { const key = `${row.studentId?._id}-${row.subjectId?._id}`; const item = byStudent.get(key) || { student: row.studentId, subject: row.subjectId, totalClasses: 0, present: 0, absent: 0 }; item.totalClasses += 1; item[row.status === 'Present' ? 'present' : 'absent'] += 1; byStudent.set(key, item); });
  res.json([...byStudent.values()].map((item) => ({ ...item, percentage: item.totalClasses ? Number((item.present / item.totalClasses * 100).toFixed(2)) : 0 })));
} catch (error) { next(error); } });
router.get('/student/:studentId', async (req, res, next) => { try { req.query.studentId = req.params.studentId; const rows = await Attendance.find({ ...range(req.query), studentId: req.params.studentId }).populate('subjectId'); res.json(rows); } catch (error) { next(error); } });
router.get('/subject/:subjectId', async (req, res, next) => { try { const rows = await Attendance.find({ subjectId: req.params.subjectId }).populate('studentId'); const dates = new Set(rows.map((row) => row.date.toISOString().slice(0, 10))); const present = rows.filter((row) => row.status === 'Present').length; res.json({ totalStudents: new Set(rows.map((row) => String(row.studentId?._id))).size, totalClasses: dates.size, averageAttendance: rows.length ? Number((present / rows.length * 100).toFixed(2)) : 0, rows }); } catch (error) { next(error); } });
router.get('/monthly', async (req, res, next) => { try { const rows = await Attendance.find(range(req.query)).populate('studentId subjectId'); res.json(rows); } catch (error) { next(error); } });
router.get('/date-wise', async (req, res, next) => { try { res.json(await Attendance.find(range(req.query)).populate('studentId subjectId').sort({ date: -1 })); } catch (error) { next(error); } });
export default router;
