import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api } from '../../../lib/api';
import { COMMANDER_SKILLS, RARITY_COLORS } from './gameConfig';
import { CommanderSkillTree } from './CommanderSkillTree';
import type { GameState } from './CommanderVillage';

interface Progress {
  level: number;
  xp: number;
  xp_needed: number;
  xp_progress: number;
  sp_unspent: number;
  sp_spent_json: string[];
  skills: typeof COMMANDER_SKILLS;
}

const SLOT_LABELS: Record<string, string> = {
  weapon: '⚔️ Weapon',
  armor: '🛡️ Armor',
  relic: '✨ Relic',
};

export function CommanderProgress({ state, onUpdate }: { state: GameState; onUpdate: () => void }) {
  const { token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [equipping, setEquipping] = useState(false);

  const fetch = async () => {
    try {
      const data = await api<Progress>('/progress', {}, token);
      setProgress(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetch(); }, [token]);

  const equipment = state.commander.commander_equipment_json || { weapon: null, armor: null, relic: null };
  const equipableItems = state.inventory.filter(
    (i) => !i.equipped_to_unit && !i.equipped_to_commander &&
      ['weapon', 'armor', 'relic'].includes(state.config.items?.find((d) => d.id === i.item_id)?.item_type || '')
  );

  const equipCommander = async (itemId: string) => {
    setEquipping(true);
    try {
      const res = await api<{ bonus?: string; slot: string }>('/game/commander/equip', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId }),
      }, token);
      notify(`Commander equipped (${res.bonus || res.slot})`, 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Equip failed', 'error');
    }
    setEquipping(false);
  };

  const itemById = (id: string | null) => state.inventory.find((i) => i.id === id);

  if (!progress) return <div className="text-xs opacity-50">Loading progress...</div>;

  const pct = Math.min(100, (progress.xp_progress / progress.xp_needed) * 100);
  const spent = progress.sp_spent_json || [];
  const skills = progress.skills?.length ? progress.skills : COMMANDER_SKILLS;
  const perks = state.commander.build_perks_json;
  const hasPerks = perks && (Object.keys(perks.discounts || {}).length > 0 || (perks.vouchers?.length || 0) > 0);

  return (
    <div className="space-y-4">
      <div className="theme-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold">Lv. {progress.level}</span>
          <span className="opacity-60">{progress.xp_progress}/{progress.xp_needed} XP</span>
        </div>
        <div className="h-3 bg-black/40 rounded overflow-hidden">
          <motion.div
            className="h-full bg-current rounded"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs opacity-50 mt-2">Skill points available: {progress.sp_unspent}</p>
      </div>

      <div className="theme-card p-4 space-y-3">
        <h3 className="text-sm font-bold">Commander Gear</h3>
        <p className="text-xs opacity-50">Armor & weapons on your commander boost your army&apos;s power.</p>
        <div className="grid grid-cols-3 gap-2">
          {(['weapon', 'armor', 'relic'] as const).map((slot) => {
            const itemId = equipment[slot];
            const item = itemById(itemId);
            return (
              <div key={slot} className="theme-card p-2 text-center min-h-[72px] flex flex-col justify-center">
                <div className="text-[10px] opacity-50">{SLOT_LABELS[slot]}</div>
                {item ? (
                  <div className="text-xs font-bold mt-1" style={{ color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}>
                    {item.name}
                  </div>
                ) : (
                  <div className="text-xs opacity-30 mt-1">Empty</div>
                )}
              </div>
            );
          })}
        </div>
        {equipableItems.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs opacity-50">Equip from inventory:</p>
            <div className="flex gap-1 flex-wrap">
              {equipableItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  disabled={equipping}
                  onClick={() => equipCommander(item.id)}
                  className="theme-btn text-xs px-2 py-1"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasPerks && (
        <div className="theme-card p-4 space-y-2">
          <h3 className="text-sm font-bold">Build Perks</h3>
          {Object.entries(perks!.discounts || {}).map(([key, val]) => (
            <div key={key} className="text-xs">🏗️ {Math.round(val * 100)}% off next {key} build</div>
          ))}
          {(perks!.vouchers || []).map((key) => (
            <div key={key} className="text-xs">🎁 Free {key} building voucher</div>
          ))}
        </div>
      )}

      <CommanderSkillTree
        skills={skills}
        spent={spent}
        spUnspent={progress.sp_unspent}
        onSpend={() => { fetch(); onUpdate?.(); }}
      />
    </div>
  );
}

export function XpBar() {
  const { token } = useAuthStore();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    api<Progress>('/progress', {}, token).then(setProgress).catch(() => {});
    const id = setInterval(() => {
      api<Progress>('/progress', {}, token).then(setProgress).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [token]);

  if (!progress) return null;
  const pct = Math.min(100, (progress.xp_progress / progress.xp_needed) * 100);

  return (
    <div className="theme-card p-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-bold">Commander Lv.{progress.level}</span>
        <span className="opacity-50">{progress.xp_progress}/{progress.xp_needed} XP · {progress.sp_unspent} SP</span>
      </div>
      <div className="h-2 bg-black/40 rounded overflow-hidden">
        <motion.div className="h-full bg-current rounded" animate={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
