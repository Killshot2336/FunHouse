import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../stores';
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
  deployments?: Array<{ user_id: string; unit_count: number }>;
}

interface WorldMapProps {
  state: GameState;
  onUpdate: () => void;
}

export function WorldMap({ state, onUpdate }: WorldMapProps) {
  const { user, token } = useAuthStore();
  const { triggerFlash, triggerShake } = useCinematicStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    api<{ zones: Zone[] }>('/game/zones', {}, token).then((d) => setZones(d.zones));
  }, [token, state]);

  const expandGrid = async () => {
    await api('/game/expand-grid', { method: 'POST' }, token);
    playSound(user!.theme, 'buildPlace');
    onUpdate();
  };

  const deploy = async () => {
    if (!selected || selectedUnits.length === 0) return;
    await api(`/game/zones/${selected.id}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ unit_ids: selectedUnits }),
    }, token);
    onUpdate();
    setSelectedUnits([]);
  };

  const attack = async () => {
    if (!selected || selectedUnits.length === 0) return;
    const res = await api<{ won: boolean; atkPower: number; defPower: number }>(`/game/zones/${selected.id}/attack`, {
      method: 'POST',
      body: JSON.stringify({ unit_ids: selectedUnits }),
    }, token);
    if (res.won) {
      triggerFlash('success');
      playSound(user!.theme, 'missionComplete');
    } else {
      triggerFlash('damage');
      triggerShake('heavy');
    }
    onUpdate();
    api<{ zones: Zone[] }>('/game/zones', {}, token).then((d) => setZones(d.zones));
    setSelectedUnits([]);
  };

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const zoneInfo = selected ? ZONE_TYPES[selected.zone_type] : null;
  const ownerColors: Record<string, string> = { aden: '#39ff14', edward: '#3b82f6', jamie: '#a855f7' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">World Map</h3>
          <p className="text-xs opacity-50">Pinch/scroll zoom · drag to pan · hourly zone yields</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScale((s) => Math.min(2.5, s + 0.2))} className="theme-btn text-xs">+</button>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} className="theme-btn text-xs">−</button>
          <button onClick={expandGrid} className="theme-btn theme-btn-primary text-xs">
            Expand Village ({state.commander.grid_size}→{state.commander.grid_size + 2})
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden border border-current/20 rounded-lg bg-black/30 relative"
        style={{ height: 320 }}
        onWheel={(e) => setScale((s) => Math.max(0.5, Math.min(2.5, s - e.deltaY * 0.001)))}
        onMouseDown={(e) => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onMouseMove={(e) => {
          if (!dragging.current) return;
          setOffset((o) => ({
            x: o.x + e.clientX - lastPos.current.x,
            y: o.y + e.clientY - lastPos.current.y,
          }));
          lastPos.current = { x: e.clientX, y: e.clientY };
        }}
      >
        <div
          className="grid gap-0.5 p-2 transition-transform"
          style={{
            gridTemplateColumns: 'repeat(12, 24px)',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          {zones.map((z) => {
            const info = ZONE_TYPES[z.zone_type];
            const isSelected = selected?.id === z.id;
            const deployCount = z.deployments?.reduce((s, d) => s + d.unit_count, 0) || 0;
            return (
              <button
                key={z.id}
                onClick={() => setSelected(z)}
                className={`w-6 h-6 text-xs flex items-center justify-center rounded transition-all ${
                  isSelected ? 'ring-2 ring-current scale-125 z-10' : ''
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
              <p className="text-xs opacity-50">Owner: {selected.owner_user_id || 'Unclaimed'} · Enemy troops: ???</p>
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
