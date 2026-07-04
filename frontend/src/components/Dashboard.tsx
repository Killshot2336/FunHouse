import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useBossStore } from '../stores';
import { api } from '../lib/api';
import { themeCopy, userProfiles, moodEmojis } from '../themes/copy';
import { BossBattle } from './BossBattle';
import { RivalBattle } from './RivalBattle';
import { MoodRing } from './MoodRing';
import { ThoughtBubbles } from './ThoughtBubbles';

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
    <div className="space-y-6">
      <div className="theme-card p-4">
        <p className="text-sm opacity-80 italic">{copy.greeting}</p>
      </div>

      <RivalBattle />

      <BossBattle bossData={bossData} />

      <MoodRing moods={moodData?.moods || []} />

      {moodData?.vents && moodData.vents.length > 0 && (
        <ThoughtBubbles vents={moodData.vents} />
      )}

      {bossData?.stats && (
        <div className="theme-card p-4">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">Weekly Champion</h3>
          <div className="flex gap-4 justify-around">
            {['aden', 'edward', 'jamie'].map((uid) => {
              const stat = bossData.stats.find((s) => s.user_id === uid);
              const isChamp = bossData.boss.champion === uid;
              return (
                <div key={uid} className={`text-center ${isChamp ? 'scale-110' : 'opacity-60'}`}>
                  <div className="text-2xl">{userProfiles[uid].emoji}</div>
                  <div className="text-xs capitalize">{uid}</div>
                  <div className="font-bold">{stat?.tasks_completed || 0}</div>
                  {isChamp && <div className="text-xs text-yellow-400">CHAMP</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="theme-card p-4">
        <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">Household Mood Ring</h3>
        <div className="flex justify-around">
          {['aden', 'edward', 'jamie'].map((uid) => {
            const mood = moodData?.moods?.find((m) => m.user_id === uid);
            return (
              <div key={uid} className="text-center">
                <div className="text-2xl">{mood ? moodEmojis[mood.mood as keyof typeof moodEmojis] || '❓' : '❓'}</div>
                <div className="text-xs capitalize mt-1">{uid}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
