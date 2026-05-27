import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/users';
import { planRouter } from './routes/plans';
import { checkinRouter } from './routes/checkins';
import { chatRouter } from './routes/chat';
import { dietRouter } from './routes/diet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRouter);
app.use('/api/plans', planRouter);
app.use('/api/checkins', checkinRouter);
app.use('/api/chat', chatRouter);
app.use('/api/diet', dietRouter);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const { pool } = await import('./db');
    const result = await pool.query('SELECT NOW()');
    console.log(`Database connected: ${result.rows[0].now}`);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
});
