import { Router } from 'express';
import { pool } from '../db';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

export const userRouter = Router();

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 注册：生成短 ID + 设密码
userRouter.post('/register', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  try {
    const id = uuid();
    const shortCode = generateShortCode();
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, short_code, password_hash, is_anonymous) VALUES ($1, $2, $3, false)`,
      [id, shortCode, hash]
    );

    res.json({ userId: id, shortCode });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Code collision, please retry' });
    }
    res.status(500).json({ error: 'Failed to register' });
  }
});

// 登录：短 ID + 密码
userRouter.post('/login', async (req, res) => {
  const { shortCode, password } = req.body;
  if (!shortCode || !password) {
    return res.status(400).json({ error: 'Short code and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE short_code=$1',
      [shortCode.toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Account not found' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    res.json({ userId: user.id, shortCode: shortCode.toUpperCase() });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 创建匿名账号（保留给游客体验）
userRouter.post('/anonymous', async (_req, res) => {
  try {
    const id = uuid();
    const result = await pool.query(
      `INSERT INTO users (id, is_anonymous) VALUES ($1, true) RETURNING id`,
      [id]
    );
    res.json({ userId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 保存 onboarding 信息
userRouter.put('/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { gender, height, weight, goal, availableDays, availableMinutes, environment, experience, dietRestrictions, equipment } = req.body;
  try {
    await pool.query(
      `UPDATE users SET gender=$2, height=$3, weight=$4, goal=$5, available_days=$6, available_minutes=$7, 
       environment=$8, experience=$9, diet_restrictions=$10, equipment=$11, updated_at=NOW()
       WHERE id=$1`,
      [
        id,
        gender,
        height || null,
        weight || null,
        goal,
        availableDays,
        availableMinutes,
        environment,
        experience,
        JSON.stringify(dietRestrictions || []),
        JSON.stringify(equipment || []),
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 获取用户信息
userRouter.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, short_code, is_anonymous, gender, height, weight, goal, available_days, available_minutes, environment, experience, diet_restrictions, equipment, created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});
