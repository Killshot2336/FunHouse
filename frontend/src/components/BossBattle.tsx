import { motion } from 'framer-motion';
import { useBossStore } from '../stores';
import { useAuthStore } from '../stores';
import { themeCopy } from '../themes/copy';
import { HoloCard } from './effects/HoloCard';

interface BossBattleProps {
  bossData: {
    boss: { current_health: number; max_health: number; champion?: string };
  } | null;
}

const BOSS_EMOJI = { morty: '👾', enclave: '🦅', warlock: '💀' };

export function BossBattle({ bossData }: BossBattleProps) {
  const { user } = useAuthStore();
  const { health, maxHealth, damageFlash } = useBossStore();
  const copy = themeCopy[user!.theme];

  const currentHealth = bossData?.boss.current_health ?? health;
  const max = bossData?.boss.max_health ?? maxHealth;
  const pct = Math.max(0, (currentHealth / max) * 100);
  const defeated = currentHealth <= 0;
  const emoji = BOSS_EMOJI[user!.theme];

  return (
    <HoloCard intense delay={0.2} className={damageFlash ? 'damage-flash screen-shake' : ''}>
      <div className="p-6 relative overflow-hidden">
        <div className="boss-aura absolute inset-0 pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <h2 className="font-bold text-xl tracking-[0.15em] glow-text">{copy.boss.name}</h2>
            <p className="text-xs opacity-50 mt-1">{copy.boss.subtitle}</p>
          </div>
          <motion.div
            className="text-6xl boss-sprite"
            animate={{
              y: [0, -8, 0],
              scale: damageFlash ? [1, 1.3, 0.9, 1] : [1, 1.05, 1],
              rotate: damageFlash ? [0, -10, 10, 0] : 0,
            }}
            transition={{ duration: damageFlash ? 0.4 : 2, repeat: damageFlash ? 0 : Infinity }}
          >
            {emoji}
          </motion.div>
        </div>

        <div className="boss-health-bar mt-2 relative z-10">
          <motion.div
            className="boss-health-fill"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
          <div className="boss-health-shine" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2 opacity-60 relative z-10">
          <span className="font-mono">{currentHealth} / {max} HP</span>
          <span className="font-mono">{Math.round(pct)}%</span>
        </div>

        {damageFlash && (
          <motion.span
            initial={{ opacity: 1, y: 0, scale: 1.5 }}
            animate={{ opacity: 0, y: -40, scale: 0.8 }}
            className="floating-damage absolute right-8 top-1/2 text-red-400 font-bold text-xl z-20"
          >
            -1
          </motion.span>
        )}

        {defeated && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-center mt-6 font-bold text-lg glow-text relative z-10"
          >
            {copy.boss.defeat}
          </motion.p>
        )}
      </div>
    </HoloCard>
  );
}
