import { Router } from 'express';
import { pool } from '../db';
import { v4 as uuid } from 'uuid';
import { streamChat } from '../services/deepseek';

export const chatRouter = Router();

// 发送消息（streaming）
chatRouter.post('/message', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message?.trim()) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  try {
    // 保存用户消息
    await pool.query(
      `INSERT INTO chat_messages (id, user_id, role, content) VALUES ($1, $2, 'user', $3)`,
      [uuid(), userId, message]
    );

    // 获取最近对话历史（最近 5 轮）
    const history = await pool.query(
      `SELECT role, content FROM chat_messages WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // 获取用户信息和当前计划
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const plan = await pool.query(
      `SELECT * FROM plans WHERE user_id=$1 AND status='confirmed' ORDER BY week_number DESC LIMIT 1`,
      [userId]
    );

    // SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const fullResponse = await streamChat(
      user.rows[0],
      plan.rows[0]
        ? (typeof plan.rows[0].weekly_plan === 'string'
            ? JSON.parse(plan.rows[0].weekly_plan)
            : plan.rows[0].weekly_plan)
        : null,
      history.rows.reverse(),
      message,
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    );

    // 保存 AI 回复
    await pool.query(
      `INSERT INTO chat_messages (id, user_id, role, content) VALUES ($1, $2, 'assistant', $3)`,
      [uuid(), userId, fullResponse]
    );

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat failed:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat failed' });
    }
  }
});
