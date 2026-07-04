import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import {
  SKILL_BRANCHES, SKILL_NODE_BONUS, skillNodeCost, normalizeCombatStats, type SkillBranch,
} from './gameConfig';
import type { GameState } from './CommanderVillage';

interface TroopSkillTreeProps {
  state: GameState;
  unitId: string;
  onUpdate: () => void;
}

const BRANCH_META: Record<SkillBranch, { label: string; icon: string; color: string }> = {
  health: { label: 'Health', icon: '❤️', color: '#22c55e' },
  damage: { label: 'Damage', icon: '⚔️', color: '#ef4444' },
  shield: { label: 'Shield', icon: '🛡️', color: '#3b82f6' },
};

export function TroopSkillTree({ state, unitId, onUpdate }: TroopSkillTreeProps) {
  const { token } = useAuthStore();
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const unit = state.units.find((u) => u.id === unitId);
  if (!unit) return null;

  const combat = normalizeCombatStats(unit.stats as Record<string, unknown>);
  const nodes = combat.skill_nodes;

  const unlock = async (branch: SkillBranch, node: number) => {
    const key = `${branch}_${node}`;
    setUnlocking(key);
    try {
      await api(`/game/units/${unitId}/skill`, {
        method: 'POST',
        body: JSON.stringify({ branch, node }),
      }, token);
      onUpdate();
    } catch { /* ignore */ }
    setUnlocking(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold">Skill Tree</h3>
      {SKILL_BRANCHES.map((branch) => {
        const meta = BRANCH_META[branch];
        return (
          <div key={branch} className="theme-card p-3">
            <div className="flex items-center gap-2 mb-2 text-sm font-bold">
              <span>{meta.icon}</span> {meta.label} (+{SKILL_NODE_BONUS[branch]}/node)
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((node) => {
                const key = `${branch}_${node}`;
                const unlocked = nodes.includes(key);
                const prevOk = node === 1 || nodes.includes(`${branch}_${node - 1}`);
                const cost = skillNodeCost(branch, node);
                const canAfford = state.commander.gold >= cost.gold && state.commander.materials >= cost.materials;
                return (
                  <button
                    key={key}
                    disabled={unlocking === key || unlocked || !prevOk}
                    onClick={() => unlock(branch, node)}
                    className={`flex-1 py-2 text-xs rounded border transition-all ${
                      unlocked ? 'border-current bg-current/20' : canAfford && prevOk ? 'border-current/40 hover:scale-105' : 'opacity-30'
                    }`}
                    style={unlocked ? { borderColor: meta.color } : undefined}
                    title={`${cost.gold}🪙 ${cost.materials}⛏️`}
                  >
                    {unlocked ? '✓' : node}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
