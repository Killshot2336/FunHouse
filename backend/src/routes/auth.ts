import { Router, Request, Response } from 'express';
import { USERS, isDemoMode, supabase } from '../lib/supabase.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

const VALID_USERS = ['aden', 'edward', 'jamie'] as const;

router.post('/identify', async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username || !(VALID_USERS as readonly string[]).includes(username)) {
    return res.status(400).json({ error: 'Pick Aden, Edward, or Jamie' });
  }

  const user = USERS[username as keyof typeof USERS];
  const token = generateToken({
    username: user.username,
    theme: user.theme,
    displayName: user.displayName,
  });

  res.json({
    token,
    user: {
      username: user.username,
      displayName: user.displayName,
      theme: user.theme,
    },
    demoMode: isDemoMode,
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username || !(VALID_USERS as readonly string[]).includes(username)) {
    return res.status(400).json({ error: 'Pick Aden, Edward, or Jamie' });
  }

  const user = USERS[username as keyof typeof USERS];
  const token = generateToken({
    username: user.username,
    theme: user.theme,
    displayName: user.displayName,
  });

  res.json({
    token,
    user: {
      username: user.username,
      displayName: user.displayName,
      theme: user.theme,
    },
    demoMode: isDemoMode,
  });
});

router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(header.slice(7), process.env.JWT_SECRET || 'funhouse-dev-secret-change-in-production') as {
      username: string;
      theme: string;
      displayName: string;
    };
    res.json({ user: decoded, demoMode: isDemoMode });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/profiles', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    return res.json(Object.values(USERS).map((u) => ({
      username: u.username,
      display_name: u.displayName,
      theme: u.theme,
    })));
  }

  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
