import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useNotificationStore } from '../stores';
import { api } from '../lib/api';
import { themeCopy } from '../themes/copy';

interface StashBag {
  id: string;
  name: string;
  weight_grams: number;
  initial_weight: number;
  added_by: string;
}

export function StashPage() {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[user!.theme];

  if (user!.username === 'jamie') {
    return (
      <div className="theme-card p-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <p className="italic opacity-60">{copy.stash.hidden}</p>
      </div>
    );
  }

  const [data, setData] = useState<{
    bags: StashBag[];
    fund: { money_saved: number };
    purchases: Array<{ id: string; amount: number; purchased_by: string; purchased_at: string }>;
  } | null>(null);
  const [stats, setStats] = useState<{ unlocked: boolean; avgCost?: number; consumptionRate?: number; efficiency?: number } | null>(null);
  const [newBagName, setNewBagName] = useState('');
  const [newBagWeight, setNewBagWeight] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [tab, setTab] = useState<'inventory' | 'fund' | 'stats'>('inventory');

  const fetch = useCallback(async () => {
    try {
      const [stash, s] = await Promise.all([
        api<typeof data>('/social/stash', {}, token),
        api<typeof stats>('/social/stash/stats', {}, token),
      ]);
      setData(stash);
      setStats(s);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);

  const addBag = async () => {
    if (!newBagName || !newBagWeight) return;
    await api('/social/stash/bags', {
      method: 'POST',
      body: JSON.stringify({ name: newBagName, weight_grams: parseFloat(newBagWeight) }),
    }, token);
    setNewBagName(''); setNewBagWeight('');
    notify('Bag added to stash', 'success');
    fetch();
  };

  const consume = async (bagId: string, type: 'bowl' | 'pinch') => {
    await api(`/social/stash/bags/${bagId}/consume`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }, token);
    notify(type === 'bowl' ? 'Bowl packed' : 'Pinch taken', 'success');
    fetch();
  };

  const logPurchase = async () => {
    if (!purchaseAmount) return;
    await api('/social/stash/purchases', {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(purchaseAmount) }),
    }, token);
    setPurchaseAmount('');
    notify('Purchase logged', 'success');
    fetch();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg tracking-wider">{copy.stash.title}</h2>

      <div className="flex gap-2">
        {(['inventory', 'fund', 'stats'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`theme-btn text-xs flex-1 capitalize ${tab === t ? 'theme-btn-primary' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'inventory' && (
        <div className="space-y-4">
          {data?.bags?.map((bag) => {
            const pct = (bag.weight_grams / bag.initial_weight) * 100;
            return (
              <div key={bag.id} className="theme-card p-4">
                <div className="flex justify-between mb-2">
                  <div className="font-bold">{bag.name}</div>
                  <div className="text-sm">{bag.weight_grams.toFixed(1)}g / {bag.initial_weight}g</div>
                </div>
                <div className="boss-health-bar mb-3">
                  <div className="boss-health-fill" style={{ width: `${pct}%`, background: 'var(--success)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => consume(bag.id, 'bowl')} className="theme-btn text-xs flex-1">🥣 Pack Bowl (0.5g)</button>
                  <button onClick={() => consume(bag.id, 'pinch')} className="theme-btn text-xs flex-1">🤏 Pinch (0.1g)</button>
                </div>
              </div>
            );
          })}
          <div className="theme-card p-4 space-y-2">
            <input value={newBagName} onChange={(e) => setNewBagName(e.target.value)} placeholder="Bag name" className="w-full p-2 bg-transparent border border-current rounded text-sm" />
            <input value={newBagWeight} onChange={(e) => setNewBagWeight(e.target.value)} type="number" placeholder="Weight (grams)" className="w-full p-2 bg-transparent border border-current rounded text-sm" />
            <button onClick={addBag} className="theme-btn theme-btn-primary w-full text-xs">Add Bag</button>
          </div>
        </div>
      )}

      {tab === 'fund' && (
        <div className="space-y-4">
          <div className="theme-card p-6 text-center">
            <div className="text-3xl font-bold">${data?.fund?.money_saved?.toFixed(2) || '0.00'}</div>
            <div className="text-xs opacity-60">Money Saved</div>
          </div>
          <div className="flex gap-2">
            <input value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} type="number" placeholder="Purchase amount" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
            <button onClick={logPurchase} className="theme-btn theme-btn-primary text-xs">Log Purchase</button>
          </div>
          <div className="space-y-2">
            {data?.purchases?.map((p) => (
              <div key={p.id} className="theme-card p-3 text-sm flex justify-between">
                <span>${p.amount}</span>
                <span className="opacity-60 capitalize">{p.purchased_by} — {new Date(p.purchased_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="theme-card p-6">
          {!stats?.unlocked ? (
            <p className="text-center opacity-60 text-sm">Advanced stats unlock after 1 month of data collection.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><div className="text-xl font-bold">${stats.avgCost?.toFixed(2)}</div><div className="text-xs opacity-60">Avg Cost</div></div>
              <div><div className="text-xl font-bold">{stats.consumptionRate?.toFixed(1)}g</div><div className="text-xs opacity-60">Total Consumed</div></div>
              <div><div className="text-xl font-bold">{stats.efficiency?.toFixed(2)}</div><div className="text-xs opacity-60">Efficiency Score</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
