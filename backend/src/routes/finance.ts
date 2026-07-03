import { Router, Request, Response } from 'express';
import { isDemoMode, supabase, getDueDateUrgency } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// House Fund
router.get('/house-fund', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const balance = store.houseFund.reduce((sum, t) => sum + (t.type === 'contribution' ? t.amount : -t.amount), 0);
    return res.json({ balance, transactions: store.houseFund.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) });
  }

  const { data, error } = await supabase.from('house_fund_transactions').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const balance = data?.reduce((sum, t) => sum + (t.type === 'contribution' ? Number(t.amount) : -Number(t.amount)), 0) || 0;
  res.json({ balance, transactions: data });
});

router.post('/house-fund', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { amount, type, reason } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const tx = { id: uuid(), user_id: user.username, amount: Number(amount), type, reason, created_at: new Date().toISOString() };
    store.houseFund.push(tx);
    return res.json(tx);
  }

  const { data, error } = await supabase.from('house_fund_transactions').insert({ user_id: user.username, amount, type, reason }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Bills
router.get('/bills', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const bills = store.bills.map((b) => ({ ...b, urgency: getDueDateUrgency(b.due_date) }));
    const unpaid = bills.filter((b) => !b.paid);
    const prediction = unpaid.length >= 3
      ? unpaid.reduce((sum, b) => sum + b.amount, 0) / unpaid.length
      : null;
    return res.json({ bills, prediction });
  }

  const { data, error } = await supabase.from('bills').select('*').order('due_date');
  if (error) return res.status(500).json({ error: error.message });
  const bills = data?.map((b) => ({ ...b, urgency: getDueDateUrgency(b.due_date) }));
  const unpaid = bills?.filter((b) => !b.paid) || [];
  const prediction = unpaid.length >= 3 ? unpaid.reduce((sum, b) => sum + Number(b.amount), 0) / unpaid.length : null;
  res.json({ bills, prediction });
});

router.post('/bills', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { name, amount, due_date } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const bill = { id: uuid(), name, amount: Number(amount), due_date, paid: false, created_by: user.username, created_at: new Date().toISOString() };
    store.bills.push(bill);
    return res.json(bill);
  }

  const { data, error } = await supabase.from('bills').insert({ name, amount, due_date, created_by: user.username }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/bills/:id/pay', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { id } = req.params;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const bill = store.bills.find((b) => b.id === id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    bill.paid = true;
    bill.paid_by = user.username;
    bill.paid_at = new Date().toISOString();
    return res.json(bill);
  }

  const { data, error } = await supabase.from('bills').update({ paid: true, paid_by: user.username, paid_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Subscriptions
router.get('/subscriptions', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const subs = store.subscriptions
      .filter((s) => s.active && (s.visibility === 'public' || s.owner_id === user.username))
      .map((s) => ({ ...s, urgency: getDueDateUrgency(s.next_billing_date) }));
    return res.json(subs);
  }

  const { data, error } = await supabase.from('subscriptions').select('*').eq('active', true);
  if (error) return res.status(500).json({ error: error.message });
  const subs = data
    ?.filter((s) => s.visibility === 'public' || s.owner_id === user.username)
    .map((s) => ({ ...s, urgency: getDueDateUrgency(s.next_billing_date) }));
  res.json(subs);
});

router.post('/subscriptions', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { name, price, next_billing_date, visibility } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const sub = { id: uuid(), name, price: Number(price), next_billing_date, visibility: visibility || 'private', owner_id: user.username, active: true, created_at: new Date().toISOString() };
    store.subscriptions.push(sub);
    return res.json(sub);
  }

  const { data, error } = await supabase.from('subscriptions').insert({ name, price, next_billing_date, visibility: visibility || 'private', owner_id: user.username }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
