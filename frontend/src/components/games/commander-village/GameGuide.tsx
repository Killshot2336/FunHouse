import { useState } from 'react';
import { RARITY_COLORS } from './gameConfig';
import { ItemInfoModal } from './ItemInfoModal';
import type { GameState } from './CommanderVillage';
import type { LootItemDef } from './gameConfig';

interface GameGuideProps {
  state: GameState;
}

export function GameGuide({ state }: GameGuideProps) {
  const [openSection, setOpenSection] = useState<string | null>('getting_started');
  const [infoItem, setInfoItem] = useState<LootItemDef | null>(null);

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
    </div>
  );
}
