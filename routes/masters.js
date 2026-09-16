import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { Year, Semester, Subject, Student } from '../models/index.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const normalizePayload = (body) => {
  const payload = { ...body };
  for (const key of ['yearId', 'semesterId']) {
    if (payload[key] && typeof payload[key] === 'object') payload[key] = payload[key]._id || payload[key].id;
  }
  delete payload._id;
  delete payload.createdAt;
  delete payload.updatedAt;
  return payload;
};
const resources = [
  { path: 'years', model: Year, populate: '' }, { path: 'semesters', model: Semester, populate: 'yearId' },
  { path: 'subjects', model: Subject, populate: 'yearId semesterId' }, { path: 'students', model: Student, populate: 'yearId semesterId' }
];
router.use(auth);
router.post('/students/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please select an Excel file.' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return res.status(400).json({ message: 'The Excel sheet is empty.' });
    const [years, semesters, existingStudents] = await Promise.all([Year.find(), Semester.find().populate('yearId'), Student.find()]);
    const clean = (value) => String(value || '').trim().toLowerCase();
    const yearKey = (value) => {
      const text = clean(value).replace(/\s+/g, ' ');
      const match = text.match(/^(\d+)(?:st|nd|rd|th)?(?:\s*year)?$/);
      return match ? match[1] : text;
    };
    const valueOf = (row, names) => { const key = Object.keys(row).find((candidate) => names.includes(clean(candidate))); return key ? String(row[key]).trim() : ''; };
    const yearByName = new Map(years.map((year) => [yearKey(year.name), year]));
    const semesterByName = new Map(semesters.map((semester) => [`${clean(semester.name)}|${semester.yearId?._id}`, semester]));
    const existingCrNumbers = new Set(existingStudents.map((student) => clean(student.crNo)));
    const sheetCrNumbers = new Set(); const valid = []; const errors = []; const skipped = [];
    rows.forEach((row, index) => {
      const line = index + 2; const name = valueOf(row, ['student name', 'student', 'name']); const crNo = valueOf(row, ['cr no', 'cr no.', 'cr number', 'crno']); const courseName = valueOf(row, ['course', 'course name', 'program', 'programme']) || 'BCA'; const batchName = valueOf(row, ['batch', 'batch name', 'lab group']) || 'General'; const yearName = valueOf(row, ['year', 'year name']); const semesterName = valueOf(row, ['semester', 'semester name']);
      const year = yearByName.get(yearKey(yearName)); const semester = year ? semesterByName.get(`${clean(semesterName)}|${year._id}`) : null;
      if (!name || !crNo || !yearName || !semesterName) errors.push(`Row ${line}: Student Name, CR No, Year, and Semester are required.`);
      else if (!year) errors.push(`Row ${line}: Year "${yearName}" was not found.`);
      else if (!semester) errors.push(`Row ${line}: Semester "${semesterName}" was not found for ${year.name}.`);
      else if (existingCrNumbers.has(clean(crNo)) || sheetCrNumbers.has(clean(crNo))) skipped.push(`Row ${line}: CR No. ${crNo} already exists.`);
      else { sheetCrNumbers.add(clean(crNo)); valid.push({ name, crNo, courseName, batchName, yearId: year._id, semesterId: semester._id }); }
    });
    if (valid.length) await Student.insertMany(valid);
    res.status(201).json({ message: `${valid.length} student(s) imported.`, imported: valid.length, skipped: skipped.length, errors });
  } catch (error) { next(error); }
});
for (const { path, model, populate } of resources) {
  router.get(`/${path}`, async (req, res, next) => { try {
    const filter = {};
    if (req.query.yearId) filter.yearId = req.query.yearId;
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.batchName) filter.batchName = req.query.batchName;
    if (req.query.courseName) filter.courseName = req.query.courseName;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) filter.$or = path === 'students'
      ? [{ name: new RegExp(req.query.search, 'i') }, { crNo: new RegExp(req.query.search, 'i') }]
      : path === 'subjects'
        ? [{ name: new RegExp(req.query.search, 'i') }, { code: new RegExp(req.query.search, 'i') }, { facultyName: new RegExp(req.query.search, 'i') }, { batchName: new RegExp(req.query.search, 'i') }]
        : [{ name: new RegExp(req.query.search, 'i') }];
    const query = model.find(filter).sort({ createdAt: -1 }); if (populate) query.populate(populate);
    if (!req.query.page) return res.json(await query);
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const [items, total] = await Promise.all([query.skip((page - 1) * pageSize).limit(pageSize), model.countDocuments(filter)]);
    res.json({ items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) });
  } catch (error) { next(error); } });
  router.get(`/${path}/:id`, async (req, res, next) => { try { const item = await model.findById(req.params.id).populate(populate); if (!item) return res.status(404).json({ message: 'Record not found' }); res.json(item); } catch (error) { next(error); } });
  router.post(`/${path}`, async (req, res, next) => { try { res.status(201).json(await model.create(normalizePayload(req.body))); } catch (error) { next(error); } });
  router.put(`/${path}/:id`, async (req, res, next) => { try { const item = await model.findByIdAndUpdate(req.params.id, normalizePayload(req.body), { new: true, runValidators: true }).populate(populate); res.json(item); } catch (error) { next(error); } });
  router.delete(`/${path}/:id`, adminOnly, async (req, res, next) => { try { await model.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted successfully' }); } catch (error) { next(error); } });
}
export default router;
