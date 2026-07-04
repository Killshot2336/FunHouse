import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';
import { ResourcePicker, ResourceChips, type ResourceBundle } from './ResourcePicker';

interface Trade {
  id: string;
  from_user: string;
  to_user: string;
  offer_json: ResourceBundle & { description?: string };
  request_json: ResourceBundle & { description?: string };
  status: string;
}

export function TradeHub({ onUpdate }: { onUpdate: () => void }) {
  const { user, token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toUser, setToUser] = useState('edward');
  const [offer, setOffer] = useState<ResourceBundle>({});
  const [request, setRequest] = useState<ResourceBundle>({});

  const fetch = async () => {
    const data = await api<Trade[]>('/game/trades', {}, token);
    setTrades(data);
  };

  useEffect(() => { fetch(); }, [token]);

  const createTrade = async () => {
    const hasOffer = Object.values(offer).some((v) => (v || 0) > 0);
    const hasRequest = Object.values(request).some((v) => (v || 0) > 0);
    if (!hasOffer || !hasRequest) return;

    await api('/game/trades', {
      method: 'POST',
      body: JSON.stringify({ to_user: toUser, offer, request }),
    }, token);
    setOffer({});
    setRequest({});
    fetch();
    onUpdate();
  };

  const accept = async (id: string) => {
    await api(`/game/trades/${id}/accept`, { method: 'POST' }, token);
    playSound(user!.theme, 'craft');
    fetch();
    onUpdate();
  };

  const others = ['aden', 'edward', 'jamie'].filter((u) => u !== user!.username);

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 space-y-4">
        <h3 className="text-sm font-bold">Create Trade Offer</h3>
        <select
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          className="w-full p-2 bg-transparent border border-current rounded text-sm"
        >
          {others.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>

        <ResourcePicker label="You offer" value={offer} onChange={setOffer} />
        <ResourcePicker label="You want" value={request} onChange={setRequest} />

        <button onClick={createTrade} className="theme-btn theme-btn-primary w-full text-sm">
          Send Trade Offer
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">Pending Trades</h3>
        {trades.length === 0 && <p className="text-xs opacity-50">No pending trades</p>}
        {trades.map((t) => (
          <div key={t.id} className="theme-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span>{userProfiles[t.from_user]?.emoji}</span>
              <span className="text-sm">{t.from_user} → {t.to_user}</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="opacity-50">Offers:</span>
                <ResourceChips bundle={t.offer_json} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="opacity-50">Wants:</span>
                <ResourceChips bundle={t.request_json} />
              </div>
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
