import { Router } from 'express';
import { pool } from '../db';
import { v4 as uuid } from 'uuid';

export const checkinRouter = Router();

// 开始训练
checkinRouter.post('/start', async (req, res) => {
  const { userId, planId, date } = req.body;
  if (!planId || !date) {
    return res.status(400).json({ error: 'planId and date are required' });
  }
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO training_check_ins (id, plan_id, date, started_at, source)
       VALUES ($1, $2, $3, NOW(), 'manual')`,
      [id, planId, date]
    );
    res.json({ checkInId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start check-in' });
  }
});

// 结束训练
checkinRouter.post('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { trainingPercent, note, reason } = req.body;
  try {
    await pool.query(
      `UPDATE training_check_ins 
       SET completed_at=NOW(), training_percent=$2, note=$3, reason=$4
       WHERE id=$1`,
      [id, trainingPercent, note, reason]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete check-in' });
  }
});

// 获取某周的打卡记录
checkinRouter.get('/week/:userId/:weekNumber', async (req, res) => {
  const { userId, weekNumber } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.* FROM training_check_ins c
       JOIN plans p ON c.plan_id = p.id
       WHERE p.user_id=$1 AND p.week_number=$2
       ORDER BY c.date`,
      [userId, parseInt(weekNumber)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get check-ins' });
  }
});
