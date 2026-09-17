import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = Router();
const tokenFor = (user) => jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || user.status === 'Inactive' || (role && user.role !== role) || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid role, email or password' });
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'faculty' } = req.body;
    const user = await User.create({ name, email, role, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});
router.post('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ message: 'All password fields are required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'New passwords do not match' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) { next(error); }
});
export default router;
