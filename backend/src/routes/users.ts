import { Router, Request, Response } from 'express';
import pool from '../db/connection';

const router = Router();

// GET all users with their posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    const users = usersResult.rows;

    if (users.length === 0) {
      return res.json([]);
    }
    const userIds = users.map((u) => u.id);
    const postsResult = await pool.query(
      'SELECT * FROM posts WHERE user_id = ANY($1) ORDER BY created_at DESC',
      [userIds]
    );

    const postsByUserId: { [key: number]: any[] } = {};
    for (const post of postsResult.rows) {
      if (!postsByUserId[post.user_id]) {
        postsByUserId[post.user_id] = [];
      }
      postsByUserId[post.user_id].push(post);
    }

    const usersWithPosts = users.map((user) => ({
      ...user,
      posts: postsByUserId[user.id] || [],
    }));

    res.json(usersWithPosts);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET single user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch user's posts
    const postsResult = await pool.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    );

    user.posts = postsResult.rows;

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, department) VALUES ($1, $2, $3) RETURNING *',
      [name, email, department || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle duplicate email error
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
