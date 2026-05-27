import { Router } from 'express';
import { pool } from '../db';
import { v4 as uuid } from 'uuid';
import { generatePlan, regeneratePlan } from '../services/deepseek';

export const planRouter = Router();

function ensureObj(val: any) {
  if (typeof val === 'object' && val !== null) return val;
  try { return JSON.parse(val); } catch { return {}; }
}

function ensureArr(val: any) {
  if (Array.isArray(val)) return val;
  try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

planRouter.post('/generate', async (req, res) => {
  const { userId, weekNumber } = req.body;
  if (!userId || !weekNumber) {
    return res.status(400).json({ error: 'userId and weekNumber are required' });
  }
  try {
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const profile = user.rows[0];

    let checkInData = null;
    let dietData = null;
    if (weekNumber > 1) {
      const prevWeek = weekNumber - 1;
      checkInData = await pool.query(
        `SELECT * FROM training_check_ins WHERE plan_id IN 
         (SELECT id FROM plans WHERE user_id=$1 AND week_number=$2)`,
        [userId, prevWeek]
      );
      dietData = await pool.query(
        `SELECT * FROM weekly_diet_reviews WHERE user_id=$1 AND week_number=$2`,
        [userId, prevWeek]
      );
    }

    const plan = await generatePlan(profile, weekNumber, checkInData?.rows, dietData?.rows?.[0]);

    const draftId = uuid();
    await pool.query(
      `INSERT INTO plan_drafts (id, user_id, week_number, revision_number, status, weekly_plan, user_feedbacks)
       VALUES ($1, $2, $3, 0, 'pending_confirmation', $4, '[]')`,
      [draftId, userId, weekNumber, JSON.stringify(plan)]
    );

    res.json({ draftId, plan });
  } catch (err) {
    console.error('Plan generation failed:', err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

planRouter.post('/drafts/:id/regenerate', async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback required' });

  try {
    const draft = await pool.query('SELECT * FROM plan_drafts WHERE id=$1', [id]);
    if (draft.rows.length === 0) return res.status(404).json({ error: 'Draft not found' });

    const current = draft.rows[0];
    const feedbacks = [...ensureArr(current.user_feedbacks), feedback];
    const prevPlan = ensureObj(current.weekly_plan);

    const user = await pool.query('SELECT * FROM users WHERE id=$1', [current.user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const newPlan = await regeneratePlan(user.rows[0], prevPlan, feedbacks);

    await pool.query(`UPDATE plan_drafts SET status='superseded' WHERE id=$1`, [id]);

    const newDraftId = uuid();
    await pool.query(
      `INSERT INTO plan_drafts (id, user_id, week_number, revision_number, status, weekly_plan, user_feedbacks)
       VALUES ($1, $2, $3, $4, 'pending_confirmation', $5, $6)`,
      [newDraftId, current.user_id, current.week_number, current.revision_number + 1,
       JSON.stringify(newPlan), JSON.stringify(feedbacks)]
    );

    res.json({ draftId: newDraftId, plan: newPlan });
  } catch (err) {
    console.error('Regeneration failed:', err);
    res.status(500).json({ error: 'Failed to regenerate plan' });
  }
});

planRouter.post('/drafts/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const draft = await pool.query('SELECT * FROM plan_drafts WHERE id=$1', [id]);
    if (draft.rows.length === 0) return res.status(404).json({ error: 'Draft not found' });

    const d = draft.rows[0];
    const planId = uuid();
    const weeklyPlan = ensureObj(d.weekly_plan);

    await pool.query(
      `INSERT INTO plans (id, user_id, week_number, status, draft_id, confirmed_at, weekly_plan)
       VALUES ($1, $2, $3, 'confirmed', $4, $5, $6)`,
      [planId, d.user_id, d.week_number, id, new Date().toISOString(), JSON.stringify(weeklyPlan)]
    );

    await pool.query(`UPDATE plan_drafts SET status='confirmed' WHERE id=$1`, [id]);

    res.json({ planId, plan: weeklyPlan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm plan' });
  }
});

planRouter.get('/active/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM plans WHERE user_id=$1 AND status='confirmed' ORDER BY week_number DESC LIMIT 1`,
      [req.params.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No active plan' });
    const row = result.rows[0];
    res.json({ ...row, weekly_plan: ensureObj(row.weekly_plan) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get plan' });
  }
});
