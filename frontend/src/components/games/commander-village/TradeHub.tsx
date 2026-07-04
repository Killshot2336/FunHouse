import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';
import { ResourcePicker, ResourceChips, type ResourceBundle } from './ResourcePicker';

interface Trade {
  id: string;
  from_user: string;
  to_user: string;
  offer_json: ResourceBundle & { description?: string; item_ids?: string[] };
  request_json: ResourceBundle & { description?: string; item_ids?: string[] };
  status: string;
}

function bundleHasContent(bundle: ResourceBundle & { item_ids?: string[] }): boolean {
  const hasResources = Object.values(bundle).some((v) => typeof v === 'number' && v > 0);
  const hasItems = (bundle.item_ids?.length || 0) > 0;
  return hasResources || hasItems;
}

export function TradeHub({ onUpdate }: { onUpdate: () => void }) {
  const { user, token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toUser, setToUser] = useState('edward');
  const [offer, setOffer] = useState<ResourceBundle>({});
  const [request, setRequest] = useState<ResourceBundle>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    const data = await api<Trade[]>('/game/trades', {}, token);
    setTrades(data);
  };

  useEffect(() => { fetch(); }, [token]);

  const createTrade = async () => {
    const hasOffer = bundleHasContent(offer);
    const hasRequest = bundleHasContent(request);
    if (!hasOffer && !hasRequest) {
      setError('Add something to offer or request');
      return;
    }

    setSending(true);
    setError('');
    try {
      await api('/game/trades', {
        method: 'POST',
        body: JSON.stringify({ to_user: toUser, offer, request }),
      }, token);
      setOffer({});
      setRequest({});
      fetch();
      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    }
    setSending(false);
  };

  const accept = async (id: string) => {
    await api(`/game/trades/${id}/accept`, { method: 'POST' }, token);
    playSound(user!.theme, 'craft');
    fetch();
    onUpdate();
  };

  const others = ['aden', 'edward', 'jamie'].filter((u) => u !== user!.username);
  const hasOffer = bundleHasContent(offer);
  const hasRequest = bundleHasContent(request);
  const isGift = hasOffer && !hasRequest;

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 space-y-4">
        <h3 className="text-sm font-bold">Send Resources</h3>
        <p className="text-xs opacity-60">
          Give items to housemates — you don&apos;t need to request anything in return.
        </p>
        <select
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          className="w-full p-2 bg-transparent border border-current rounded text-sm"
        >
          {others.map((u) => <option key={u} value={u}>{userProfiles[u]?.emoji} {u}</option>)}
        </select>

        <ResourcePicker label="You give" value={offer} onChange={setOffer} />
        <ResourcePicker label="You want (optional)" value={request} onChange={setRequest} />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={createTrade}
          disabled={sending || (!hasOffer && !hasRequest)}
          className="theme-btn theme-btn-primary w-full text-sm"
        >
          {sending ? 'Sending...' : isGift ? 'Send Gift' : hasOffer && hasRequest ? 'Send Trade Offer' : 'Send Request'}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">Pending Trades</h3>
        {trades.length === 0 && <p className="text-xs opacity-50">No pending trades</p>}
        {trades.map((t) => {
          const offerEmpty = !bundleHasContent(t.offer_json);
          const requestEmpty = !bundleHasContent(t.request_json);
          const isIncomingGift = t.to_user === user!.username && !offerEmpty && requestEmpty;

          return (
            <div key={t.id} className="theme-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span>{userProfiles[t.from_user]?.emoji}</span>
                <span className="text-sm">{t.from_user} → {t.to_user}</span>
                {offerEmpty && !requestEmpty && <span className="text-xs opacity-50">(request)</span>}
                {!offerEmpty && requestEmpty && <span className="text-xs text-green-400">(gift)</span>}
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="opacity-50">Gives:</span>
                  <ResourceChips bundle={t.offer_json} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="opacity-50">Wants:</span>
                  <ResourceChips bundle={t.request_json} />
                </div>
              </div>
              {t.to_user === user!.username && t.status === 'pending' && (
                <button onClick={() => accept(t.id)} className="theme-btn theme-btn-primary text-xs mt-2 w-full">
                  {isIncomingGift ? 'Accept Gift' : 'Accept Trade'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
