import { useGameState } from '../../hooks/useGameState';

interface ClickerState {
  scrap: number;
  totalTaps: number;
  upgrades: { autoTinker: number; multiplier: number };
  inventory: string[];
}

const PARTS = ['Warp Drive Fragment', 'Portal Fluid', 'Microverse Battery', 'Plumbus Part', 'Neutrino Coil'];

export function EdwardClicker() {
  const defaultState: ClickerState = { scrap: 0, totalTaps: 0, upgrades: { autoTinker: 0, multiplier: 1 }, inventory: [] };
  const { state, save } = useGameState(defaultState);

  const tinker = () => {
    const gain = state.upgrades.multiplier;
    save({ ...state, scrap: state.scrap + gain, totalTaps: state.totalTaps + 1 });
  };

  const buyAutoTinker = () => {
    const cost = (state.upgrades.autoTinker + 1) * 50;
    if (state.scrap < cost) return;
    save({
      ...state,
      scrap: state.scrap - cost,
      upgrades: { ...state.upgrades, autoTinker: state.upgrades.autoTinker + 1 },
    });
  };

  const buyMultiplier = () => {
    const cost = state.upgrades.multiplier * 100;
    if (state.scrap < cost) return;
    save({
      ...state,
      scrap: state.scrap - cost,
      upgrades: { ...state.upgrades, multiplier: state.upgrades.multiplier + 1 },
    });
  };

  const openCrate = () => {
    if (state.scrap < 25) return;
    const part = PARTS[Math.floor(Math.random() * PARTS.length)];
    save({
      ...state,
      scrap: state.scrap - 25,
      inventory: [...state.inventory, part],
    });
  };

  return (
    <div className="space-y-4">
      <div className="theme-card p-6 text-center">
        <div className="text-4xl font-bold text-portal-green">{state.scrap} Scrap</div>
        <div className="text-xs opacity-60 mt-1">{state.totalTaps} tinks performed</div>
      </div>

      <button
        onClick={tinker}
        className="theme-btn theme-btn-primary w-full py-8 text-2xl font-bold animate-pulse-glow"
      >
        🔧 TINKER
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={buyAutoTinker} className="theme-card p-4 text-center text-sm">
          <div>🤖 Auto-Tinker Bot</div>
          <div className="text-xs opacity-60">Lv.{state.upgrades.autoTinker} — {(state.upgrades.autoTinker + 1) * 50} Scrap</div>
        </button>
        <button onClick={buyMultiplier} className="theme-card p-4 text-center text-sm">
          <div>⚡ Multiplier</div>
          <div className="text-xs opacity-60">x{state.upgrades.multiplier} — {state.upgrades.multiplier * 100} Scrap</div>
        </button>
      </div>

      <button onClick={openCrate} className="theme-btn w-full">
        📦 Open Crate (25 Scrap)
      </button>

      {state.inventory.length > 0 && (
        <div className="theme-card p-4">
          <h3 className="text-sm font-bold mb-2">Inventory</h3>
          {state.inventory.map((item, i) => (
            <div key={i} className="text-xs opacity-80">• {item}</div>
          ))}
        </div>
      )}
    </div>
  );
}
