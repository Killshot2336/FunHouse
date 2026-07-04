import { useState } from 'react';

export type ResourceKey = 'gold' | 'materials' | 'food' | 'faction_currency';

export const RESOURCES: Record<ResourceKey, { icon: string; label: string }> = {
  gold: { icon: '🪙', label: 'Gold' },
  materials: { icon: '⛏️', label: 'Materials' },
  food: { icon: '🌾', label: 'Food' },
  faction_currency: { icon: '⭐', label: 'Faction' },
};

export type ResourceBundle = Partial<Record<ResourceKey, number>>;

interface ResourcePickerProps {
  label: string;
  value: ResourceBundle;
  onChange: (v: ResourceBundle) => void;
}

export function ResourcePicker({ label, value, onChange }: ResourcePickerProps) {
  const [active, setActive] = useState<ResourceKey | null>(null);
  const [amount, setAmount] = useState('10');

  const addResource = () => {
    if (!active) return;
    const n = Math.max(0, parseInt(amount) || 0);
    if (n === 0) return;
    onChange({ ...value, [active]: (value[active] || 0) + n });
    setAmount('10');
    setActive(null);
  };

  const remove = (key: ResourceKey) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold opacity-70">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(RESOURCES) as ResourceKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActive(active === key ? null : key)}
            className={`theme-card px-3 py-2 text-lg transition-all ${
              active === key ? 'border-2 border-current scale-105' : 'opacity-60'
            }`}
            title={RESOURCES[key].label}
          >
            {RESOURCES[key].icon}
          </button>
        ))}
      </div>

      {active && (
        <div className="flex gap-2 items-center">
          <span className="text-lg">{RESOURCES[active].icon}</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 p-2 bg-transparent border border-current rounded text-sm"
          />
          <button onClick={addResource} className="theme-btn theme-btn-primary text-xs px-3 py-2">Add</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap min-h-[28px]">
        {(Object.keys(RESOURCES) as ResourceKey[]).filter((k) => (value[k] || 0) > 0).map((key) => (
          <button
            key={key}
            onClick={() => remove(key)}
            className="theme-card px-2 py-1 text-xs flex items-center gap-1 hover:opacity-70"
            title="Tap to remove"
          >
            {RESOURCES[key].icon} {value[key]}
          </button>
        ))}
        {Object.keys(value).length === 0 && <span className="text-xs opacity-40">Tap an icon to add resources</span>}
      </div>
    </div>
  );
}

export function ResourceChips({ bundle }: { bundle: ResourceBundle & { description?: string } }) {
  const keys = (Object.keys(RESOURCES) as ResourceKey[]).filter((k) => (bundle[k] || 0) > 0);
  if (keys.length === 0) return <span className="text-xs opacity-40">{bundle.description || 'nothing'}</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {keys.map((k) => (
        <span key={k} className="theme-card px-2 py-0.5 text-xs">
          {RESOURCES[k].icon} {bundle[k]}
        </span>
      ))}
    </div>
  );
}
