import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useNotificationStore } from '../stores';
import { api, getUrgencyClass } from '../lib/api';
import { themeCopy } from '../themes/copy';

export function FinancePage() {
  const { user } = useAuthStore();
  const copy = themeCopy[user!.theme];
  const [tab, setTab] = useState<'fund' | 'bills' | 'subs'>('fund');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['fund', 'bills', 'subs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`theme-btn text-xs flex-1 ${tab === t ? 'theme-btn-primary' : ''}`}
          >
            {t === 'fund' ? copy.fund.title : t === 'bills' ? copy.bills.title : copy.subscriptions.title}
          </button>
        ))}
      </div>
      {tab === 'fund' && <HouseFund />}
      {tab === 'bills' && <BillsSection />}
      {tab === 'subs' && <SubscriptionsSection />}
    </div>
  );
}

function HouseFund() {
  const { token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[useAuthStore.getState().user!.theme];
  const [data, setData] = useState<{ balance: number; transactions: Array<{ id: string; user_id: string; amount: number; type: string; reason?: string; created_at: string }> } | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const fetch = useCallback(async () => {
    const d = await api<typeof data>('/finance/house-fund', {}, token);
    setData(d);
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);

  const transact = async (type: 'contribution' | 'withdrawal') => {
    if (!amount) return;
    await api('/finance/house-fund', {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(amount), type, reason }),
    }, token);
    setAmount('');
    setReason('');
    notify(`${type} recorded`, 'success');
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="theme-card p-6 text-center">
        <div className="text-3xl font-bold">${data?.balance?.toFixed(2) || '0.00'}</div>
        <div className="text-xs opacity-60 mt-1">House Fun Balance</div>
      </div>
      <div className="flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => transact('contribution')} className="theme-btn theme-btn-primary flex-1 text-xs">{copy.fund.contribute}</button>
        <button onClick={() => transact('withdrawal')} className="theme-btn flex-1 text-xs">{copy.fund.withdraw}</button>
      </div>
      <div className="space-y-2">
        {data?.transactions?.map((tx) => (
          <div key={tx.id} className="theme-card p-3 text-sm flex justify-between">
            <span>{tx.type === 'contribution' ? '+' : '-'}${tx.amount} — {tx.reason || 'N/A'}</span>
            <span className="opacity-60 capitalize">{tx.user_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillsSection() {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[user!.theme];
  const [data, setData] = useState<{ bills: Array<{ id: string; name: string; amount: number; due_date: string; paid: boolean; urgency: string }>; prediction: number | null } | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetch = useCallback(async () => {
    const d = await api<typeof data>('/finance/bills', {}, token);
    setData(d);
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);

  const addBill = async () => {
    if (!name || !amount || !dueDate) return;
    await api('/finance/bills', {
      method: 'POST',
      body: JSON.stringify({ name, amount: parseFloat(amount), due_date: dueDate }),
    }, token);
    setName(''); setAmount(''); setDueDate('');
    notify('Bill added', 'success');
    fetch();
  };

  const payBill = async (id: string) => {
    await api(`/finance/bills/${id}/pay`, { method: 'PATCH' }, token);
    notify('Bill paid!', 'success');
    fetch();
  };

  return (
    <div className="space-y-4">
      {data?.prediction && (
        <div className="theme-card p-4 text-center">
          <div className="text-xs opacity-60">{copy.bills.predict}</div>
          <div className="text-xl font-bold">${data.prediction.toFixed(2)}</div>
        </div>
      )}
      <div className="space-y-2">
        {data?.bills?.map((bill) => (
          <div key={bill.id} className={`theme-card p-4 ${getUrgencyClass(bill.urgency)} ${bill.paid ? 'opacity-40' : ''}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">{bill.name}</div>
                <div className="text-sm">${bill.amount} — Due {bill.due_date}</div>
              </div>
              {!bill.paid && (
                <button onClick={() => payBill(bill.id)} className="theme-btn text-xs">Pay</button>
              )}
              {bill.paid && <span className="text-green-400 text-xs">PAID</span>}
            </div>
          </div>
        ))}
      </div>
      {user!.username === 'dada' && (
        <div className="theme-card p-4 space-y-2">
          <h3 className="text-sm font-bold">{copy.bills.add}</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bill name" className="w-full p-2 bg-transparent border border-current rounded text-sm" />
          <div className="flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
          </div>
          <button onClick={addBill} className="theme-btn theme-btn-primary w-full text-xs">{copy.bills.add}</button>
        </div>
      )}
    </div>
  );
}

function SubscriptionsSection() {
  const { token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[useAuthStore.getState().user!.theme];
  const [subs, setSubs] = useState<Array<{ id: string; name: string; price: number; next_billing_date: string; visibility: string; urgency: string }>>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const fetch = useCallback(async () => {
    const d = await api<typeof subs>('/finance/subscriptions', {}, token);
    setSubs(d);
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);

  const addSub = async () => {
    if (!name || !price || !date) return;
    await api('/finance/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ name, price: parseFloat(price), next_billing_date: date, visibility }),
    }, token);
    setName(''); setPrice(''); setDate('');
    notify('Subscription added', 'success');
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {subs.map((sub) => (
          <div key={sub.id} className={`theme-card p-4 ${getUrgencyClass(sub.urgency)}`}>
            <div className="flex justify-between">
              <div>
                <div className="font-bold">{sub.name}</div>
                <div className="text-sm">${sub.price}/mo — Next: {sub.next_billing_date}</div>
              </div>
              <span className="text-xs opacity-60">{sub.visibility === 'public' ? copy.subscriptions.public : copy.subscriptions.private}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="theme-card p-4 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name" className="w-full p-2 bg-transparent border border-current rounded text-sm" />
        <div className="flex gap-2">
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Price" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVisibility('public')} className={`theme-btn text-xs flex-1 ${visibility === 'public' ? 'theme-btn-primary' : ''}`}>{copy.subscriptions.public}</button>
          <button onClick={() => setVisibility('private')} className={`theme-btn text-xs flex-1 ${visibility === 'private' ? 'theme-btn-primary' : ''}`}>{copy.subscriptions.private}</button>
        </div>
        <button onClick={addSub} className="theme-btn theme-btn-primary w-full text-xs">Add Subscription</button>
      </div>
    </div>
  );
}
