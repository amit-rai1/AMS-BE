import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(auth, adminOnly);
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, status: user.status });

router.get('/', async (req, res, next) => {
  try { res.json(await User.find({ role: { $in: ['faculty', 'hod'] } }).select('-password').sort({ role: 1, name: 1 })); }
  catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role = 'faculty' } = req.body;
    if (!['faculty', 'hod'].includes(role)) return res.status(400).json({ message: 'Role must be Faculty or HOD' });
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 10), role, status: 'Active' });
    res.status(201).json(safeUser(user));
  } catch (error) { next(error); }
});
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, status, role = 'faculty' } = req.body;
    if (!['faculty', 'hod'].includes(role)) return res.status(400).json({ message: 'Role must be Faculty or HOD' });
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: { $in: ['faculty', 'hod'] } }, { name, email: email?.toLowerCase(), status, role }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Faculty not found' });
    res.json(user);
  } catch (error) { next(error); }
});
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!user) return res.status(404).json({ message: 'Faculty not found' });
    user.password = await bcrypt.hash(password, 10); await user.save();
    res.json({ message: 'Faculty password reset successfully' });
  } catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
  try { const user = await User.findOneAndDelete({ _id: req.params.id, role: { $in: ['faculty', 'hod'] } }); if (!user) return res.status(404).json({ message: 'Faculty/HOD not found' }); res.json({ message: 'Account deleted successfully' }); }
  catch (error) { next(error); }
});
export default router;
