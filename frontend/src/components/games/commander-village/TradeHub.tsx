import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';
import { ResourcePicker, ResourceChips, type ResourceBundle } from './ResourcePicker';
import { ItemPicker, ItemChips } from './ItemPicker';
import type { GameState } from './CommanderVillage';

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

type TradeBundle = ResourceBundle & { item_ids?: string[] };

export function TradeHub({ state, onUpdate }: { state: GameState; onUpdate: () => void }) {
  const { user, token } = useAuthStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toUser, setToUser] = useState('edward');
  const [offer, setOffer] = useState<TradeBundle>({});
  const [request, setRequest] = useState<TradeBundle>({});
  const [offerItems, setOfferItems] = useState<string[]>([]);
  const [requestItems, setRequestItems] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    const data = await api<Trade[]>('/game/trades', {}, token);
    setTrades(data);
  };

  useEffect(() => { fetch(); }, [token]);

  const offerBundle = (): TradeBundle => ({
    ...offer,
    item_ids: offerItems.length ? offerItems : undefined,
  });

  const requestBundle = (): TradeBundle => ({
    ...request,
    item_ids: requestItems.length ? requestItems : undefined,
  });

  const createTrade = async () => {
    const o = offerBundle();
    const r = requestBundle();
    const hasOffer = bundleHasContent(o);
    const hasRequest = bundleHasContent(r);
    if (!hasOffer && !hasRequest) {
      setError('Add something to offer or request');
      return;
    }

    setSending(true);
    setError('');
    try {
      await api('/game/trades', {
        method: 'POST',
        body: JSON.stringify({ to_user: toUser, offer: o, request: r }),
      }, token);
      setOffer({});
      setRequest({});
      setOfferItems([]);
      setRequestItems([]);
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
  const hasOffer = bundleHasContent(offerBundle());
  const hasRequest = bundleHasContent(requestBundle());
  const isGift = hasOffer && !hasRequest;

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 space-y-4">
        <h3 className="text-sm font-bold">Trade & Gifts</h3>
        <p className="text-xs opacity-60">
          Send resources or equipment to housemates — gifts need no return.
        </p>
        <select
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          className="w-full p-2 bg-transparent border border-current rounded text-sm"
        >
          {others.map((u) => <option key={u} value={u}>{userProfiles[u]?.emoji} {u}</option>)}
        </select>

        <ResourcePicker label="You give (resources)" value={offer} onChange={setOffer} />
        <ItemPicker label="You give (equipment)" inventory={state.inventory} selectedIds={offerItems} onChange={setOfferItems} />

        <ResourcePicker label="You want (resources, optional)" value={request} onChange={setRequest} />
        <ItemPicker label="You want (equipment, optional)" inventory={state.inventory} selectedIds={requestItems} onChange={setRequestItems} />

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
                  <ItemChips itemIds={t.offer_json.item_ids} inventory={state.inventory} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="opacity-50">Wants:</span>
                  <ResourceChips bundle={t.request_json} />
                  <ItemChips itemIds={t.request_json.item_ids} inventory={state.inventory} />
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
