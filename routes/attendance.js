import { Router } from 'express';
import { Attendance, Student } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = Router(); router.use(auth);
router.get('/', async (req, res, next) => { try {
  const filter = {}; if (req.query.subjectId) filter.subjectId = req.query.subjectId; if (req.query.batchName) filter.batchName = req.query.batchName; if (req.query.date) filter.date = { $gte: new Date(`${req.query.date}T00:00:00`), $lt: new Date(`${req.query.date}T23:59:59.999`) };
  res.json(await Attendance.find(filter).populate('studentId subjectId yearId semesterId').sort({ date: -1 }));
} catch (error) { next(error); } });
router.get('/roster', async (req, res, next) => { try { const filter = { yearId: req.query.yearId, semesterId: req.query.semesterId, status: 'Active' }; if (req.query.batchName && req.query.batchName !== 'General') filter.batchName = req.query.batchName; res.json(await Student.find(filter).sort({ crNo: 1 })); } catch (error) { next(error); } });
router.post('/bulk', async (req, res, next) => { try {
  const { yearId, semesterId, subjectId, courseName = 'BCA', batchName = 'General', date, records } = req.body; if (!yearId || !semesterId || !subjectId || !date || !records?.length) return res.status(400).json({ message: 'Year, semester, subject, date, and students are required' });
  const operations = records.map(({ studentId, status, remarks = '' }) => ({ updateOne: { filter: { studentId, subjectId, date: new Date(date) }, update: { $set: { yearId, semesterId, subjectId, courseName, batchName, date: new Date(date), status, remarks } }, upsert: true } }));
  await Attendance.bulkWrite(operations); res.json({ message: 'Attendance saved', count: records.length });
} catch (error) { next(error); } });
router.put('/:id', async (req, res, next) => { try { res.json(await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (error) { next(error); } });
router.get('/student/:studentId', async (req, res, next) => { try { res.json(await Attendance.find({ studentId: req.params.studentId }).populate('subjectId').sort({ date: -1 })); } catch (error) { next(error); } });
router.get('/subject/:subjectId', async (req, res, next) => { try { res.json(await Attendance.find({ subjectId: req.params.subjectId }).populate('studentId').sort({ date: -1 })); } catch (error) { next(error); } });
export default router;
