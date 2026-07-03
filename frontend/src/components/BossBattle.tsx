import { useBossStore } from '../stores';
import { useAuthStore } from '../stores';
import { themeCopy } from '../themes/copy';

interface BossBattleProps {
  bossData: {
    boss: { current_health: number; max_health: number; champion?: string };
  } | null;
}

export function BossBattle({ bossData }: BossBattleProps) {
  const { user } = useAuthStore();
  const { health, maxHealth, damageFlash } = useBossStore();
  const copy = themeCopy[user!.theme];

  const currentHealth = bossData?.boss.current_health ?? health;
  const max = bossData?.boss.max_health ?? maxHealth;
  const pct = Math.max(0, (currentHealth / max) * 100);
  const defeated = currentHealth <= 0;

  return (
    <div className={`theme-card p-6 ${damageFlash ? 'damage-flash' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-bold text-lg tracking-wider">{copy.boss.name}</h2>
          <p className="text-xs opacity-60">{copy.boss.subtitle}</p>
        </div>
        <div className="text-4xl">
          {user!.theme === 'morty' && '👾'}
          {user!.theme === 'enclave' && '🦅'}
          {user!.theme === 'warlock' && '💀'}
        </div>
      </div>

      <div className="boss-health-bar mt-4">
        <div
          className="boss-health-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 opacity-60">
        <span>{currentHealth} / {max} HP</span>
        <span>{Math.round(pct)}%</span>
      </div>

      {defeated && (
        <p className="text-center mt-4 font-bold animate-pulse">{copy.boss.defeat}</p>
      )}
    </div>
  );
}
