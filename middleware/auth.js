import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
}
export function adminOnly(req, res, next) {
  if (!['admin', 'hod'].includes(req.user?.role)) return res.status(403).json({ message: 'Admin or HOD access required' });
  next();
}
export function facultyOnly(req, res, next) {
  if (req.user?.role !== 'faculty') return res.status(403).json({ message: 'Faculty access required' });
  next();
}
