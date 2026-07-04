import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api } from '../../../lib/api';
import { RARITY_COLORS } from './gameConfig';
import { ItemInfoModal } from './ItemInfoModal';
import type { GameState } from './CommanderVillage';
import type { LootItemDef } from './gameConfig';

interface GameGuideProps {
  state: GameState;
  onUpdate?: () => void;
}

export function GameGuide({ state, onUpdate }: GameGuideProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [openSection, setOpenSection] = useState<string | null>('getting_started');
  const [infoItem, setInfoItem] = useState<LootItemDef | null>(null);
  const [wiping, setWiping] = useState(false);

  const guide = state.config.guide || [];
  const items = (state.config.items || []) as LootItemDef[];
  const upgradeTrees = state.config.upgrade_trees || {};

  return (
    <div className="space-y-3">
      {guide.map((section: { key: string; title: string; content: string }) => (
        <div key={section.key} className="theme-card overflow-hidden">
          <button
            onClick={() => setOpenSection(openSection === section.key ? null : section.key)}
            className="w-full p-3 text-left flex justify-between items-center"
          >
            <span className="text-sm font-bold">{section.title}</span>
            <span className="text-xs opacity-50">{openSection === section.key ? '▼' : '▶'}</span>
          </button>
          {openSection === section.key && (
            <div className="px-3 pb-3 text-xs opacity-80">{section.content}</div>
          )}
        </div>
      ))}

      <div className="theme-card overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'buildings_detail' ? null : 'buildings_detail')}
          className="w-full p-3 text-left flex justify-between items-center"
        >
          <span className="text-sm font-bold">Building Upgrades</span>
          <span className="text-xs opacity-50">{openSection === 'buildings_detail' ? '▼' : '▶'}</span>
        </button>
        {openSection === 'buildings_detail' && (
          <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(upgradeTrees).map(([key, slots]) => (
              <div key={key}>
                <div className="text-xs font-bold capitalize">{key.replace('_', ' ')}</div>
                {(slots as Array<{ slot: number; name: string; desc: string }>).map((s) => (
                  <div key={s.slot} className="text-[10px] opacity-60 ml-2">
                    {s.slot}. {s.name}: {s.desc}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="theme-card overflow-hidden">
        <button
          onClick={() => setOpenSection(openSection === 'glossary' ? null : 'glossary')}
          className="w-full p-3 text-left flex justify-between items-center"
        >
          <span className="text-sm font-bold">Loot Glossary</span>
          <span className="text-xs opacity-50">{openSection === 'glossary' ? '▼' : '▶'}</span>
        </button>
        {openSection === 'glossary' && (
          <div className="px-3 pb-3 grid grid-cols-2 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setInfoItem(item)}
                className="text-left p-2 rounded border border-current/10 hover:border-current/30"
              >
                <div className="text-xs font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                <div className="text-[10px] opacity-50">{item.item_type}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {infoItem && <ItemInfoModal item={infoItem} onClose={() => setInfoItem(null)} />}

      {user?.username === 'aden' && (
        <div className="theme-card p-4 space-y-3 border border-red-500/30">
          <h3 className="text-sm font-bold text-red-400">Reset Game</h3>
          <p className="text-xs opacity-60">
            Wipe all villages, troops, inventory, trades, XP, and world captures for Aden, Edward &amp; Jamie. Everyone starts fresh.
          </p>
          <button
            disabled={wiping}
            onClick={async () => {
              if (!confirm('Wipe ALL game data for everyone? This cannot be undone.')) return;
              setWiping(true);
              try {
                await api('/game/wipe', { method: 'POST', body: JSON.stringify({ full: true }) }, token);
                notify('Game reset — everyone starts fresh!', 'success');
                onUpdate?.();
              } catch (e) {
                notify(e instanceof Error ? e.message : 'Reset failed', 'error');
              }
              setWiping(false);
            }}
            className="theme-btn w-full text-sm border border-red-500/50 text-red-400"
          >
            {wiping ? 'Resetting...' : 'Reset All Game Data'}
          </button>
        </div>
      )}
    </div>
  );
}
