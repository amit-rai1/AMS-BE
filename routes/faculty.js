import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(auth, adminOnly);
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, status: user.status });

router.get('/', async (req, res, next) => {
  try { res.json(await User.find({ role: 'faculty' }).select('-password').sort({ name: 1 })); }
  catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 10), role: 'faculty', status: 'Active' });
    res.status(201).json(safeUser(user));
  } catch (error) { next(error); }
});
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, status } = req.body;
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'faculty' }, { name, email: email?.toLowerCase(), status }, { new: true, runValidators: true }).select('-password');
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
  try { const user = await User.findOneAndDelete({ _id: req.params.id, role: 'faculty' }); if (!user) return res.status(404).json({ message: 'Faculty not found' }); res.json({ message: 'Faculty deleted successfully' }); }
  catch (error) { next(error); }
});
export default router;
