import { useEffect, useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';
import { ResourcePicker, ResourceChips, type ResourceBundle } from './ResourcePicker';
import { ItemPicker, ItemChips } from './ItemPicker';
import type { GameState } from './CommanderVillage';

interface TradeItemLabel { id: string; name: string; rarity?: string }

interface Trade {
  id: string;
  from_user: string;
  to_user: string;
  offer_json: ResourceBundle & { description?: string; item_ids?: string[]; item_labels?: TradeItemLabel[] };
  request_json: ResourceBundle & { description?: string; item_ids?: string[]; item_labels?: TradeItemLabel[] };
  status: string;
}

type TradeBundle = ResourceBundle & { item_ids?: string[]; item_labels?: TradeItemLabel[] };

function bundleHasContent(bundle: ResourceBundle & { item_ids?: string[] }): boolean {
  const hasResources = Object.values(bundle).some((v) => typeof v === 'number' && v > 0);
  const hasItems = (bundle.item_ids?.length || 0) > 0;
  return hasResources || hasItems;
}

export function TradeHub({ state, onUpdate }: { state: GameState; onUpdate: () => void }) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [toUser, setToUser] = useState('edward');
  const [offer, setOffer] = useState<TradeBundle>({});
  const [request, setRequest] = useState<TradeBundle>({});
  const [offerItems, setOfferItems] = useState<string[]>([]);
  const [requestItems, setRequestItems] = useState<string[]>([]);
  const [partnerInventory, setPartnerInventory] = useState<GameState['inventory']>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    const data = await api<Trade[]>('/game/trades', {}, token);
    setTrades(data);
  };

  useEffect(() => { fetch(); }, [token]);

  useEffect(() => {
    api<GameState['inventory']>(`/game/housemate/${toUser}/inventory`, {}, token)
      .then(setPartnerInventory)
      .catch(() => setPartnerInventory([]));
    setRequestItems([]);
  }, [toUser, token]);

  const itemLabels = (ids: string[], source: GameState['inventory']) =>
    ids.map((id) => {
      const item = source.find((i) => i.id === id);
      return item ? { id, name: item.name, rarity: item.rarity } : { id, name: 'item' };
    });

  const offerBundle = (): TradeBundle => ({
    ...offer,
    item_ids: offerItems.length ? offerItems : undefined,
    item_labels: offerItems.length ? itemLabels(offerItems, state.inventory) : undefined,
  });

  const requestBundle = (): TradeBundle => ({
    ...request,
    item_ids: requestItems.length ? requestItems : undefined,
    item_labels: requestItems.length ? itemLabels(requestItems, partnerInventory) : undefined,
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
      playSound(user!.theme, 'craft');
      const gift = hasOffer && !hasRequest;
      notify(gift ? `Gift sent to ${toUser}!` : `Trade offer sent to ${toUser}!`, 'success');
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
    try {
      await api(`/game/trades/${id}/accept`, { method: 'POST' }, token);
      playSound(user!.theme, 'complete');
      notify('Trade accepted!', 'success');
      fetch();
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Accept failed', 'error');
    }
  };

  const reject = async (id: string) => {
    try {
      await api(`/game/trades/${id}/reject`, { method: 'POST' }, token);
      notify('Trade declined', 'info');
      fetch();
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Reject failed', 'error');
    }
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
        <ItemPicker label="You want (equipment, optional)" inventory={partnerInventory} selectedIds={requestItems} onChange={setRequestItems} />

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
                  <ItemChips itemIds={t.offer_json.item_ids} itemLabels={t.offer_json.item_labels} inventory={state.inventory} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="opacity-50">Wants:</span>
                  <ResourceChips bundle={t.request_json} />
                  <ItemChips itemIds={t.request_json.item_ids} itemLabels={t.request_json.item_labels} inventory={partnerInventory} />
                </div>
              </div>
              {t.to_user === user!.username && t.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => accept(t.id)} className="theme-btn theme-btn-primary text-xs flex-1">
                    {isIncomingGift ? 'Accept Gift' : 'Accept Trade'}
                  </button>
                  <button onClick={() => reject(t.id)} className="theme-btn text-xs flex-1 opacity-70">
                    Decline
                  </button>
                </div>
              )}
              {t.from_user === user!.username && t.status === 'pending' && (
                <button onClick={() => reject(t.id)} className="theme-btn text-xs mt-2 w-full opacity-70">
                  Cancel Offer
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
