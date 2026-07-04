import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';

interface Trade {
  id: string;
  from_user: string;
  to_user: string;
  offer_json: { gold?: number; description?: string };
  request_json: { gold?: number; description?: string };
  status: string;
}

export function TradeHub({ onUpdate }: { onUpdate: () => void }) {
  const { user, token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toUser, setToUser] = useState('edward');
  const [offerGold, setOfferGold] = useState('10');
  const [requestGold, setRequestGold] = useState('10');

  const fetch = async () => {
    const data = await api<Trade[]>('/game/trades', {}, token);
    setTrades(data);
  };

  useEffect(() => { fetch(); }, [token]);

  const createTrade = async () => {
    await api('/game/trades', {
      method: 'POST',
      body: JSON.stringify({
        to_user: toUser,
        offer: { gold: parseInt(offerGold), description: `${offerGold} gold` },
        request: { gold: parseInt(requestGold), description: `${requestGold} gold` },
      }),
    }, token);
    fetch();
    onUpdate();
  };

  const accept = async (id: string) => {
    await api(`/game/trades/${id}/accept`, { method: 'POST' }, token);
    fetch();
    onUpdate();
  };

  const others = ['aden', 'edward', 'jamie'].filter((u) => u !== user!.username);

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 space-y-3">
        <h3 className="text-sm font-bold">Create Trade Offer</h3>
        <select value={toUser} onChange={(e) => setToUser(e.target.value)} className="w-full p-2 bg-transparent border border-current rounded text-sm">
          {others.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="flex gap-2">
          <input value={offerGold} onChange={(e) => setOfferGold(e.target.value)} type="number" placeholder="Offer gold" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
          <input value={requestGold} onChange={(e) => setRequestGold(e.target.value)} type="number" placeholder="Request gold" className="flex-1 p-2 bg-transparent border border-current rounded text-sm" />
        </div>
        <button onClick={createTrade} className="theme-btn theme-btn-primary w-full text-sm">Send Trade Offer</button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">Pending Trades</h3>
        {trades.length === 0 && <p className="text-xs opacity-50">No pending trades</p>}
        {trades.map((t) => (
          <div key={t.id} className="theme-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>{userProfiles[t.from_user]?.emoji}</span>
              <span className="text-sm">{t.from_user} → {t.to_user}</span>
            </div>
            <div className="text-xs opacity-60">
              Offers: {(t.offer_json as { description?: string }).description || 'items'}
              | Wants: {(t.request_json as { description?: string }).description || 'items'}
            </div>
            {t.to_user === user!.username && t.status === 'pending' && (
              <button onClick={() => accept(t.id)} className="theme-btn theme-btn-primary text-xs mt-2 w-full">
                Accept Trade
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
