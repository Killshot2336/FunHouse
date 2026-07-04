import { useEffect, useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { ZONE_TYPES } from './gameConfig';
import type { GameState } from './CommanderVillage';

interface Zone {
  id: string;
  zone_x: number;
  zone_y: number;
  zone_type: string;
  owner_user_id: string | null;
  yield_json: Record<string, number>;
  deployments?: Array<{ user_id: string; unit_count: number; deployed_power?: number }>;
}

interface WorldMapProps {
  state: GameState;
  onUpdate: () => void;
}

export function WorldMap({ state, onUpdate }: WorldMapProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const { triggerFlash, triggerShake } = useCinematicStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [scoutRange, setScoutRange] = useState(false);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  useEffect(() => {
    api<{ zones: Zone[]; scout_range?: boolean }>('/game/zones', {}, token)
      .then((d) => {
        setZones(d.zones);
        setScoutRange(!!d.scout_range);
      })
      .catch(() => notify('Failed to load world map', 'error'));
  }, [token, state]);

  const expandGrid = async () => {
    try {
      const res = await api<{ cost?: number }>('/game/expand-grid', { method: 'POST' }, token);
      playSound(user!.theme, 'buildPlace');
      notify(`Village expanded! (-${res.cost ?? '?'}🪙)`, 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Expand failed', 'error');
    }
  };

  const deploy = async () => {
    if (!selected || selectedUnits.length === 0) return;
    try {
      await api(`/game/zones/${selected.id}/deploy`, {
        method: 'POST',
        body: JSON.stringify({ unit_ids: selectedUnits }),
      }, token);
      playSound(user!.theme, 'craft');
      notify('Troops deployed!', 'success');
      onUpdate();
      setSelectedUnits([]);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Deploy failed', 'error');
    }
  };

  const attack = async () => {
    if (!selected || selectedUnits.length === 0) return;
    try {
      const res = await api<{ won: boolean; atkPower: number; defPower: number }>(`/game/zones/${selected.id}/attack`, {
        method: 'POST',
        body: JSON.stringify({ unit_ids: selectedUnits }),
      }, token);
      if (res.won) {
        triggerFlash('success');
        playSound(user!.theme, 'missionComplete');
        notify(`Zone captured! (${res.atkPower} vs ${res.defPower})`, 'success');
      } else {
        triggerFlash('damage');
        triggerShake('heavy');
        notify(`Attack failed (${res.atkPower} vs ${res.defPower})`, 'error');
      }
      onUpdate();
      api<{ zones: Zone[]; scout_range?: boolean }>('/game/zones', {}, token).then((d) => {
        setZones(d.zones);
        setScoutRange(!!d.scout_range);
      });
      setSelectedUnits([]);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Attack failed', 'error');
    }
  };

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const zoneInfo = selected ? ZONE_TYPES[selected.zone_type] : null;
  const ownerColors: Record<string, string> = { aden: '#39ff14', edward: '#3b82f6', jamie: '#a855f7' };
  const enemyDeploy = selected?.deployments?.find((d) => d.user_id !== user?.username);
  const enemyPowerHint = scoutRange && enemyDeploy?.deployed_power != null
    ? `~${enemyDeploy.deployed_power} power`
    : '???';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">World Map</h3>
          <p className="text-xs opacity-50">Tap zones to deploy and attack</p>
        </div>
        <button onClick={expandGrid} className="theme-btn theme-btn-primary text-xs">
          Expand Village ({state.commander.grid_size}→{state.commander.grid_size + 2})
        </button>
      </div>

      <div className="overflow-x-auto flex justify-center">
        <div
          className="grid gap-0.5 p-2 border border-current/20 rounded-lg bg-black/30"
          style={{ gridTemplateColumns: 'repeat(12, 28px)' }}
        >
          {zones.map((z) => {
            const info = ZONE_TYPES[z.zone_type];
            const isSelected = selected?.id === z.id;
            const deployCount = z.deployments?.reduce((s, d) => s + d.unit_count, 0) || 0;
            return (
              <button
                key={z.id}
                onClick={() => setSelected(z)}
                className={`w-7 h-7 text-xs flex items-center justify-center rounded transition-all ${
                  isSelected ? 'ring-2 ring-current scale-110 z-10' : ''
                }`}
                style={{
                  background: z.owner_user_id ? `${ownerColors[z.owner_user_id] || '#666'}44` : '#111',
                  border: `1px solid ${z.owner_user_id ? ownerColors[z.owner_user_id] || '#666' : '#333'}`,
                }}
                title={`${info?.name || z.zone_type} · ${deployCount} troops hidden`}
              >
                {info?.icon || '?'}
              </button>
            );
          })}
        </div>
      </div>

      {selected && zoneInfo && (
        <div className="theme-card p-4 space-y-3">
          <div className="flex justify-between">
            <div>
              <h4 className="font-bold text-sm">{zoneInfo.icon} {zoneInfo.name} ({selected.zone_x},{selected.zone_y})</h4>
              <p className="text-xs opacity-50">
                Yield/hr: {Object.entries(selected.yield_json).map(([k, v]) => `${v} ${k}`).join(', ')}
              </p>
              <p className="text-xs opacity-50">Owner: {selected.owner_user_id || 'Unclaimed'} · Enemy: {enemyPowerHint}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs opacity-50">✕</button>
          </div>

          <div>
            <p className="text-xs font-bold mb-1">Select troops to deploy/attack</p>
            <div className="flex flex-wrap gap-1">
              {state.units.map((u) => {
                const def = state.config.units.find((x) => x.key === u.unit_key);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUnit(u.id)}
                    className={`theme-btn text-xs px-2 py-1 ${selectedUnits.includes(u.id) ? 'theme-btn-primary' : ''}`}
                  >
                    {def?.icon} {def?.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={deploy} className="theme-btn flex-1 text-xs py-2">Deploy</button>
            <button onClick={attack} className="theme-btn theme-btn-primary flex-1 text-xs py-2">Attack Zone</button>
          </div>
        </div>
      )}
    </div>
  );
}
