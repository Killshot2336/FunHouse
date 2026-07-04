import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import { COMMANDER_SKILLS } from './gameConfig';
import { CommanderSkillTree } from './CommanderSkillTree';

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

  if (!progress) return <div className="text-xs opacity-50">Loading progress...</div>;

  const pct = Math.min(100, (progress.xp_progress / progress.xp_needed) * 100);
  const spent = progress.sp_spent_json || [];
  const skills = progress.skills?.length ? progress.skills : COMMANDER_SKILLS;

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

      <CommanderSkillTree
        skills={skills}
        spent={spent}
        spUnspent={progress.sp_unspent}
        onSpend={fetch}
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
