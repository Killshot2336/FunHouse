import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import { COMMANDER_SKILLS } from './gameConfig';

interface Progress {
  level: number;
  xp: number;
  xp_needed: number;
  xp_progress: number;
  sp_unspent: number;
  sp_spent_json: string[];
  skills: typeof COMMANDER_SKILLS;
}

export function CommanderProgress() {
  const { token } = useAuthStore();
  const [progress, setProgress] = useState<Progress | null>(null);

  const fetch = async () => {
    try {
      const data = await api<Progress>('/progress', {}, token);
      setProgress(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetch(); }, [token]);

  const spendSp = async (skillKey: string) => {
    await api('/progress/spend', { method: 'POST', body: JSON.stringify({ skill_key: skillKey }) }, token);
    fetch();
  };

  if (!progress) return <div className="text-xs opacity-50">Loading progress...</div>;

  const pct = Math.min(100, (progress.xp_progress / progress.xp_needed) * 100);
  const spent = progress.sp_spent_json || [];

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
        <p className="text-xs opacity-50 mt-2">SP available: {progress.sp_unspent}</p>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2">Commander Skill Tree</h3>
        <div className="space-y-2">
          {COMMANDER_SKILLS.map((skill) => {
            const unlocked = spent.includes(skill.key);
            return (
              <button
                key={skill.key}
                disabled={unlocked || progress.sp_unspent < skill.cost}
                onClick={() => spendSp(skill.key)}
                className={`theme-card w-full p-3 text-left ${unlocked ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between">
                  <span className="font-bold text-sm">{skill.name}</span>
                  <span className="text-xs">{unlocked ? '✓' : `${skill.cost} SP`}</span>
                </div>
                <p className="text-xs opacity-50">{skill.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
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
