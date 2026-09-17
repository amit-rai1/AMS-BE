import { Router } from 'express';
import { Leave, User } from '../models/index.js';
import { auth, adminOnly, facultyOnly } from '../middleware/auth.js';

const router = Router();
router.use(auth);
const populate = [{ path: 'applicantId', select: 'name email role' }, { path: 'reviewedBy', select: 'name email role' }];
const emailTemplate = (leave) => ({
  subject: `Leave application - ${leave.leaveType}`,
  body: `Dear Admin/HOD,\n\nI, ${leave.applicantId?.name || 'Faculty member'}, request ${leave.leaveType?.toLowerCase() || 'leave'} from ${new Date(leave.startDate).toLocaleDateString('en-IN')} to ${new Date(leave.endDate).toLocaleDateString('en-IN')}.\n\nReason: ${leave.reason}\n\nKindly review my application.\n\nRegards,\n${leave.applicantId?.name || 'Faculty member'}`
});
router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'faculty' ? { applicantId: req.user.id } : {};
    const leaves = await Leave.find(filter).populate(populate).sort({ createdAt: -1 });
    res.json(leaves.map((leave) => ({ ...leave.toObject(), emailTemplate: emailTemplate(leave) })));
  } catch (error) { next(error); }
});
router.post('/', facultyOnly, async (req, res, next) => {
  try {
    const { startDate, endDate, leaveType = 'Casual', reason, recipientEmail } = req.body;
    if (!startDate || !endDate || !reason) return res.status(400).json({ message: 'Dates and reason are required' });
    if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ message: 'End date cannot be before start date' });
    const leave = await Leave.create({ applicantId: req.user.id, startDate, endDate, leaveType, reason, recipientEmail });
    await leave.populate(populate);
    res.status(201).json({ ...leave.toObject(), emailTemplate: emailTemplate(leave) });
  } catch (error) { next(error); }
});
router.patch('/:id/review', adminOnly, async (req, res, next) => {
  try {
    const { status, reviewComment = '' } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Review status must be Approved or Rejected' });
    const leave = await Leave.findByIdAndUpdate(req.params.id, { status, reviewComment, reviewedBy: req.user.id, reviewedAt: new Date() }, { new: true }).populate(populate);
    if (!leave) return res.status(404).json({ message: 'Leave application not found' });
    res.json({ ...leave.toObject(), emailTemplate: emailTemplate(leave) });
  } catch (error) { next(error); }
});
router.get('/approvers', facultyOnly, async (req, res, next) => {
  try { res.json(await User.find({ role: { $in: ['admin', 'hod'] }, status: 'Active' }).select('name email role').sort({ role: 1, name: 1 })); }
  catch (error) { next(error); }
});
export default router;
