import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useBossStore } from '../stores';
import { api } from '../lib/api';
import { themeCopy, userProfiles, moodEmojis } from '../themes/copy';
import { BossBattle } from './BossBattle';
import { RivalBattle } from './RivalBattle';
import { MoodRing } from './MoodRing';
import { ThoughtBubbles } from './ThoughtBubbles';
import { HoloCard } from './effects/HoloCard';

interface BossData {
  boss: { current_health: number; max_health: number; champion?: string; champion_tasks?: number };
  stats: Array<{ user_id: string; tasks_completed: number }>;
}

interface MoodData {
  moods: Array<{ user_id: string; mood: string }>;
  vents: Array<{ id: string; vent_text: string }>;
}

export function Dashboard() {
  const { user, token } = useAuthStore();
  const { setBoss } = useBossStore();
  const copy = themeCopy[user!.theme];
  const [bossData, setBossData] = useState<BossData | null>(null);
  const [moodData, setMoodData] = useState<MoodData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [boss, moods] = await Promise.all([
        api<BossData>('/tasks/boss', {}, token),
        api<MoodData>('/social/moods', {}, token),
      ]);
      setBossData(boss);
      setMoodData(moods);
      setBoss(boss.boss.current_health, boss.boss.max_health, boss.boss.champion || null);
    } catch { /* retry on next poll */ }
  }, [token, setBoss]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-5">
      <HoloCard delay={0}>
        <div className="p-4">
          <motion.p
            className="text-sm opacity-90 italic tracking-wide"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            {copy.greeting}
          </motion.p>
        </div>
      </HoloCard>

      <RivalBattle />
      <BossBattle bossData={bossData} />

      <MoodRing moods={moodData?.moods || []} />

      {moodData?.vents && moodData.vents.length > 0 && (
        <ThoughtBubbles vents={moodData.vents} />
      )}

      {bossData?.stats && (
        <HoloCard delay={0.4}>
          <div className="p-4">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-[0.2em] glow-text">Weekly Champion</h3>
            <div className="flex gap-4 justify-around">
              {['aden', 'edward', 'jamie'].map((uid, i) => {
                const stat = bossData.stats.find((s) => s.user_id === uid);
                const isChamp = bossData.boss.champion === uid;
                return (
                  <motion.div
                    key={uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, scale: isChamp ? 1.1 : 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`text-center ${isChamp ? 'champion-glow' : 'opacity-50'}`}
                  >
                    <motion.div
                      className="text-3xl"
                      animate={isChamp ? { y: [0, -4, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {userProfiles[uid].emoji}
                    </motion.div>
                    <div className="text-xs capitalize mt-1 tracking-wider">{uid}</div>
                    <div className="font-bold text-lg">{stat?.tasks_completed || 0}</div>
                    {isChamp && <div className="text-[10px] text-yellow-400 tracking-widest mt-1">★ CHAMP</div>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </HoloCard>
      )}

      <HoloCard delay={0.5}>
        <div className="p-4">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-[0.2em] opacity-70">Household Mood Ring</h3>
          <div className="flex justify-around">
            {['aden', 'edward', 'jamie'].map((uid, i) => {
              const mood = moodData?.moods?.find((m) => m.user_id === uid);
              return (
                <motion.div
                  key={uid}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                  className="text-center"
                >
                  <div className="text-3xl mood-orb">{mood ? moodEmojis[mood.mood as keyof typeof moodEmojis] || '❓' : '❓'}</div>
                  <div className="text-xs capitalize mt-2 opacity-60">{uid}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </HoloCard>
    </div>
  );
}
