import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import catCareRoutes from './routes/catCare.js';
import taskRoutes from './routes/tasks.js';
import financeRoutes from './routes/finance.js';
import socialRoutes from './routes/social.js';
import gameRoutes from './routes/game.js';
import rivalRoutes from './routes/rival.js';
import { isDemoMode } from './lib/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', demoMode: isDemoMode, app: 'Funhouse' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cat-care', catCareRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/rival', rivalRoutes);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Funhouse API running on port ${PORT}${isDemoMode ? ' (DEMO MODE)' : ''}`);
  });
}

export default app;
