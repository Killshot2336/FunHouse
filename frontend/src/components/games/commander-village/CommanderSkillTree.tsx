import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import { COMMANDER_SKILL_BRANCHES, type CommanderSkillBranch } from './gameConfig';

interface SkillDef {
  key: string;
  branch: CommanderSkillBranch;
  node: number;
  name: string;
  cost: number;
  desc: string;
}

interface CommanderSkillTreeProps {
  skills: SkillDef[];
  spent: string[];
  spUnspent: number;
  onSpend: () => void;
}

const BRANCH_META: Record<CommanderSkillBranch, { label: string; icon: string; color: string }> = {
  economy: { label: 'Economy', icon: '🪙', color: '#f59e0b' },
  army: { label: 'Army', icon: '⚔️', color: '#ef4444' },
  world: { label: 'World', icon: '🗺️', color: '#3b82f6' },
};

export function CommanderSkillTree({ skills, spent, spUnspent, onSpend }: CommanderSkillTreeProps) {
  const { token } = useAuthStore();
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const unlock = async (skill: SkillDef) => {
    setUnlocking(skill.key);
    try {
      await api('/progress/spend', { method: 'POST', body: JSON.stringify({ skill_key: skill.key }) }, token);
      onSpend();
    } catch { /* ignore */ }
    setUnlocking(null);
  };

  return (
    <div className="space-y-4">
      {COMMANDER_SKILL_BRANCHES.map((branch) => {
        const meta = BRANCH_META[branch];
        const branchSkills = skills
          .filter((s) => s.branch === branch)
          .sort((a, b) => a.node - b.node);

        return (
          <div key={branch} className="theme-card p-3">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold">
              <span>{meta.icon}</span> {meta.label}
            </div>
            <div className="flex gap-2 items-stretch">
              {branchSkills.map((skill, i) => {
                const unlocked = spent.includes(skill.key);
                const prevKey = branchSkills.find((s) => s.node === skill.node - 1)?.key;
                const prevOk = skill.node === 1 || (prevKey ? spent.includes(prevKey) : true);
                const canAfford = spUnspent >= skill.cost;
                return (
                  <div key={skill.key} className="flex-1 flex flex-col items-center min-w-0">
                    {i > 0 && (
                      <div className="w-full h-0.5 bg-current/20 mb-1" style={{ marginTop: -2 }} />
                    )}
                    <button
                      type="button"
                      disabled={unlocking === skill.key || unlocked || !prevOk || !canAfford}
                      onClick={() => unlock(skill)}
                      className={`w-full py-2 px-1 text-[10px] rounded border transition-all ${
                        unlocked
                          ? 'border-current bg-current/20'
                          : canAfford && prevOk
                            ? 'border-current/40 hover:scale-105'
                            : 'opacity-30'
                      }`}
                      style={unlocked ? { borderColor: meta.color } : undefined}
                      title={`${skill.name} — ${skill.desc} (${skill.cost} SP)`}
                    >
                      <div className="font-bold">{unlocked ? '✓' : skill.node}</div>
                      <div className="opacity-70 truncate w-full">{skill.name}</div>
                      {!unlocked && <div className="opacity-50">{skill.cost} SP</div>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
