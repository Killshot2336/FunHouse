import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { themeCopy } from '../../../themes/copy';
import { HoloCard } from '../../effects/HoloCard';
import { useCountdown, nextDungeonResetIso } from './useCountdown';
import { GameIcon } from './GameIcon';
import type { GameState } from './CommanderVillage';

const FIGHT_MAX_SEC = 20;

interface RoomPreview {
  index: number;
  name: string;
  icon: string;
  enemyPower: number;
  lootRarity: string;
  isBoss: boolean;
  bossName?: string;
}

interface DungeonState {
  seed: number;
  resets_at: string;
  rooms_preview: RoomPreview[];
  room_count: number;
  player_power: number;
  run: {
    id: string;
    room_index: number;
    status: string;
    loot_json: unknown[];
  } | null;
}

interface DungeonRunProps {
  state: GameState;
  onUpdate: () => void;
}

export function DungeonRun({ state, onUpdate }: DungeonRunProps) {
  const { user, token } = useAuthStore();
  const copy = themeCopy[user!.theme].commanderVillage;
  const notify = useNotificationStore((s) => s.show);
  const { triggerFlash, triggerShake } = useCinematicStore();
  const [dungeon, setDungeon] = useState<DungeonState | null>(null);
  const [fighting, setFighting] = useState(false);
  const [fightSec, setFightSec] = useState(0);
  const [bossHpPct, setBossHpPct] = useState(100);
  const [resetNotice, setResetNotice] = useState(false);
  const fightStartRef = useRef<string | null>(null);
  const fightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDungeon = useCallback(() => {
    api<DungeonState>('/game/dungeon', {}, token).then(setDungeon).catch(() => {});
  }, [token]);

  useEffect(() => { fetchDungeon(); }, [fetchDungeon, state]);

  const resetTarget = dungeon?.resets_at || nextDungeonResetIso();
  const { label: countdownLabel, done: resetDone } = useCountdown(resetTarget);

  useEffect(() => {
    if (resetDone) {
      setResetNotice(true);
      fetchDungeon();
      onUpdate();
    }
  }, [resetDone, fetchDungeon, onUpdate]);

  const currentRoom = dungeon?.run && dungeon.run.status === 'active'
    ? dungeon.rooms_preview[dungeon.run.room_index]
    : null;

  const clearFightTimer = () => {
    if (fightTimerRef.current) {
      clearInterval(fightTimerRef.current);
      fightTimerRef.current = null;
    }
  };

  const finishFight = async () => {
    clearFightTimer();
    setFighting(false);
    if (!fightStartRef.current) return;
    try {
      const res = await api<{ completed: boolean; loot?: { name?: string; rarity?: string } }>(
        '/game/dungeon/claim',
        { method: 'POST', body: JSON.stringify({ fight_started_at: fightStartRef.current }) },
        token
      );
      triggerFlash(res.completed ? 'legendary' : 'success');
      playSound(user!.theme, res.completed ? 'legendary' : 'missionComplete');
      notify(
        res.completed ? copy.victory : `${copy.victory.split('!')[0]} — ${res.loot?.name || 'loot'}!`,
        'success'
      );
      fightStartRef.current = null;
      setBossHpPct(100);
      setFightSec(0);
      fetchDungeon();
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Claim failed', 'error');
      fightStartRef.current = null;
    }
  };

  const startFight = () => {
    if (!currentRoom) return;
    const playerPower = dungeon?.player_power || state.commander.power_rating;
    if (playerPower < currentRoom.enemyPower * 0.8) {
      notify(copy.defeat + ` Need ~${Math.floor(currentRoom.enemyPower * 0.8)} power.`, 'error');
      return;
    }

    fightStartRef.current = new Date().toISOString();
    setFighting(true);
    setFightSec(0);
    setBossHpPct(100);
    playSound(user!.theme, 'buildPlace');
    triggerShake('light');

    const durationMs = FIGHT_MAX_SEC * 1000;
    const start = Date.now();
    clearFightTimer();
    fightTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const sec = Math.floor(elapsed / 1000);
      setFightSec(Math.min(FIGHT_MAX_SEC, sec));
      setBossHpPct(Math.max(0, 100 - (elapsed / durationMs) * 100));
      if (elapsed >= 1000 && elapsed % 2000 < 100) triggerShake('light');
      if (elapsed >= durationMs) {
        finishFight();
      }
    }, 100);
  };

  useEffect(() => () => clearFightTimer(), []);

  const enter = async () => {
    try {
      await api('/game/dungeon/enter', { method: 'POST' }, token);
      playSound(user!.theme, 'buildPlace');
      notify('Entered the dungeon!', 'success');
      setResetNotice(false);
      fetchDungeon();
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Enter failed', 'error');
    }
  };

  if (!dungeon) return <div className="text-center p-4 opacity-60 text-sm">Loading dungeon...</div>;

  const run = dungeon.run;
  const progress = run ? (run.room_index / dungeon.room_count) * 100 : 0;
  const canEnterNew = !run || run.status === 'completed';

  return (
    <div className="space-y-4">
      <HoloCard intense className="p-4">
        <h3 className="text-sm font-bold glow-text">{copy.dungeonTitle}</h3>
        <p className="text-xs opacity-60 mt-1">{copy.dungeonIntro}</p>
        <p className="text-xs opacity-50 mt-2">Resets in {countdownLabel} · Seed #{dungeon.seed}</p>
        {resetNotice && <p className="text-xs text-green-400 mt-1">New dungeon available!</p>}
        <div className="mt-2 h-2 bg-black/30 rounded overflow-hidden">
          <motion.div
            className="h-full bg-current"
            style={{ opacity: 0.7 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </HoloCard>

      <AnimatePresence mode="wait">
        {fighting && currentRoom ? (
          <motion.div
            key="fight"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="theme-card p-6 text-center space-y-4 boss-aura relative overflow-hidden"
          >
            <div className="boss-aura absolute inset-0 pointer-events-none" />
            <motion.div
              className="text-6xl relative z-10"
              animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <GameIcon icon={currentRoom.icon} size="lg" />
            </motion.div>
            <h3 className="text-lg font-bold glow-text relative z-10">
              {currentRoom.bossName || currentRoom.name}
            </h3>
            <p className="text-xs opacity-60 relative z-10">
              ⚔️ {dungeon.player_power || state.commander.power_rating} vs 💀 {currentRoom.enemyPower}
            </p>
            <div className="boss-health-bar relative z-10">
              <motion.div
                className="boss-health-fill"
                style={{ width: `${bossHpPct}%`, background: 'var(--danger, #ef4444)' }}
              />
            </div>
            <p className="text-xs opacity-50 relative z-10">
              Fighting... {fightSec}s / {FIGHT_MAX_SEC}s
            </p>
          </motion.div>
        ) : (
          <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-2">
            {dungeon.rooms_preview.map((room) => (
              <HoloCard
                key={room.index}
                className={`p-3 text-center ${
                  run && room.index < run.room_index ? 'opacity-40' :
                  run && room.index === run.room_index && run.status === 'active' ? 'ring-2 ring-current' : ''
                }`}
              >
                <GameIcon icon={room.icon} size="md" />
                <div className="text-xs font-bold mt-1">{room.name}</div>
                {room.isBoss && <div className="text-[10px] text-red-400">BOSS</div>}
                <div className="text-[10px] opacity-50">💀 {room.enemyPower}</div>
                {run && room.index < run.room_index && <div className="text-[10px] text-green-400">✓ Cleared</div>}
              </HoloCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {canEnterNew && !fighting && (
          <button onClick={enter} className="theme-btn theme-btn-primary flex-1 py-2 text-sm">
            {run?.status === 'completed' ? 'Enter New Dungeon' : 'Enter Dungeon'}
          </button>
        )}
        {run && run.status === 'active' && !fighting && currentRoom && (
          <button onClick={startFight} className="theme-btn theme-btn-primary flex-1 py-3 text-sm font-bold animate-pulse">
            {copy.fight} {currentRoom.isBoss ? 'BOSS' : 'ROOM'}
          </button>
        )}
      </div>
    </div>
  );
}
