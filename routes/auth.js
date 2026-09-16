import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const router = Router();
const tokenFor = (user) => jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1d' });
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
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
export default router;
