import { motion } from 'framer-motion';
import { HoloCard } from '../../effects/HoloCard';
import { RARITY_COLORS, RARITY_LABELS, normalizeCombatStats, type Rarity } from './gameConfig';

interface TroopCardProps {
  name: string;
  icon: string;
  rarity?: Rarity;
  stats: Record<string, unknown>;
  selected?: boolean;
  onClick?: () => void;
}

export function TroopCard({ name, icon, rarity = 'common', stats, selected, onClick }: TroopCardProps) {
  const combat = normalizeCombatStats(stats);
  const color = RARITY_COLORS[rarity];

  return (
    <HoloCard onClick={onClick} className={`cursor-pointer ${selected ? 'ring-2' : ''}`}>
      <div className="p-3 space-y-2" style={{ borderLeft: `4px solid ${color}` }}>
        <div className="flex items-start justify-between">
          <span className="text-3xl">{icon}</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: `${color}33`, color }}>
            {RARITY_LABELS[rarity]}
          </span>
        </div>
        <div className="font-bold text-sm">{name}</div>
        <div className="space-y-1 text-xs">
          <StatBar label="HP" value={combat.health} max={200} color="#22c55e" />
          <StatBar label="DMG" value={combat.damage} max={80} color="#ef4444" />
          <StatBar label="SHD" value={combat.shield} max={60} color="#3b82f6" />
        </div>
      </div>
    </HoloCard>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 opacity-60">{label}</span>
      <div className="flex-1 h-1.5 bg-black/40 rounded overflow-hidden">
        <motion.div
          className="h-full rounded"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="w-6 text-right">{value}</span>
    </div>
  );
}
