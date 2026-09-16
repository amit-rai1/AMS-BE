import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import authRoutes from './routes/auth.js';
import masterRoutes from './routes/masters.js';
import attendanceRoutes from './routes/attendance.js';
import reportRoutes from './routes/reports.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'attendance-api' }));
app.use('/api/auth', authRoutes);
app.use('/api', masterRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://raiamit9264_db_user:SKEYDOfB7F7M2Wvh@cluster0.94ohlo0.mongodb.net/';
mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(port, () => {
      console.log(`API listening at http://localhost:${port}`);
    });
  })
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });

export default app;
