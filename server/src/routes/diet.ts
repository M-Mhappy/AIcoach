import { Router } from 'express';
import { pool } from '../db';
import { v4 as uuid } from 'uuid';

export const dietRouter = Router();

// 提交每周饮食反馈
dietRouter.post('/review', async (req, res) => {
  const { userId, weekNumber, planId, dietPercent, dietNote, dietTags } = req.body;
  try {
    const id = uuid();
    await pool.query(
      `INSERT INTO weekly_diet_reviews (id, user_id, week_number, plan_id, diet_percent, diet_note, diet_tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, weekNumber, planId, dietPercent, dietNote, JSON.stringify(dietTags || [])]
    );
    res.json({ reviewId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit diet review' });
  }
});

// 获取某周饮食反馈
dietRouter.get('/review/:userId/:weekNumber', async (req, res) => {
  const { userId, weekNumber } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM weekly_diet_reviews WHERE user_id=$1 AND week_number=$2`,
      [userId, parseInt(weekNumber)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No review found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get diet review' });
  }
});
