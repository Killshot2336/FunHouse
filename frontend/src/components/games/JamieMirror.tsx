import { useState } from 'react';
import { useGameState } from '../../hooks/useGameState';

interface MirrorState {
  essences: number;
  cosmetics: { aura: string; armor: string; horns: string; eyes: string };
  ritualsCompleted: number;
}

const AURAS = ['none', 'shadow', 'blood', 'arcane', 'void'];
const ARMORS = ['none', 'leather', 'chain', 'plate', 'shadow-weave'];
const HORNS = ['none', 'small', 'curved', 'spiked', 'crown'];
const EYES = ['default', 'glowing-red', 'void-black', 'golden', 'heterochromia'];

const RITUAL_PATTERNS = [
  [0, 1, 2, 5, 8, 7, 6, 3],
  [0, 2, 8, 6, 0],
  [1, 2, 5, 8, 7, 4, 1],
];

export function JamieMirror() {
  const defaultState: MirrorState = {
    essences: 0,
    cosmetics: { aura: 'none', armor: 'none', horns: 'none', eyes: 'default' },
    ritualsCompleted: 0,
  };
  const { state, save } = useGameState(defaultState);
  const [ritualActive, setRitualActive] = useState(false);
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [showing, setShowing] = useState(false);

  const startRitual = () => {
    const p = RITUAL_PATTERNS[Math.floor(Math.random() * RITUAL_PATTERNS.length)];
    setPattern(p);
    setPlayerSeq([]);
    setRitualActive(true);
    setShowing(true);

    let i = 0;
    const showInterval = setInterval(() => {
      i++;
      if (i >= p.length) {
        clearInterval(showInterval);
        setShowing(false);
      }
    }, 600);
  };

  const tapCell = (idx: number) => {
    if (showing) return;
    const newSeq = [...playerSeq, idx];
    setPlayerSeq(newSeq);

    if (newSeq[newSeq.length - 1] !== pattern[newSeq.length - 1]) {
      setRitualActive(false);
      setPlayerSeq([]);
      return;
    }

    if (newSeq.length === pattern.length) {
      save({
        ...state,
        essences: state.essences + 5,
        ritualsCompleted: state.ritualsCompleted + 1,
      });
      setRitualActive(false);
      setPlayerSeq([]);
    }
  };

  const buyCosmetic = (category: keyof MirrorState['cosmetics'], item: string, cost: number) => {
    if (state.essences < cost) return;
    save({
      ...state,
      essences: state.essences - cost,
      cosmetics: { ...state.cosmetics, [category]: item },
    });
  };

  const renderCharacter = () => {
    const { cosmetics } = state;
    return (
      <div className="text-center py-8 relative">
        {cosmetics.aura !== 'none' && (
          <div className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ background: cosmetics.aura === 'blood' ? '#8b0000' : cosmetics.aura === 'shadow' ? '#333' : '#ff4444' }}
          />
        )}
        <div className="text-6xl relative">
          {cosmetics.horns !== 'none' ? '😈' : '👤'}
        </div>
        <div className="text-xs mt-2 opacity-60 capitalize">
          {cosmetics.armor} armor • {cosmetics.eyes} eyes • {cosmetics.aura} aura
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="theme-card p-4">
        {renderCharacter()}
        <div className="text-center">
          <div className="text-xl font-bold">{state.essences} Essences</div>
          <div className="text-xs opacity-60">{state.ritualsCompleted} rituals completed</div>
        </div>
      </div>

      {!ritualActive ? (
        <button onClick={startRitual} className="theme-btn theme-btn-primary w-full py-4">
          🔮 Begin Ritual (15s)
        </button>
      ) : (
        <div className="theme-card p-4">
          <p className="text-xs text-center mb-3 opacity-60">
            {showing ? 'Watch the pattern...' : 'Repeat the pattern'}
          </p>
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => tapCell(i)}
                className={`aspect-square rounded border-2 border-current transition-all ${
                  showing && pattern.includes(i) ? 'bg-red-900 opacity-80' :
                  playerSeq.includes(i) ? 'bg-red-800' : 'opacity-30'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="theme-card p-4 space-y-3">
        <h3 className="text-sm font-bold">Cosmetics Shop</h3>
        {(['aura', 'armor', 'horns', 'eyes'] as const).map((cat) => (
          <div key={cat}>
            <div className="text-xs uppercase opacity-60 mb-1">{cat}</div>
            <div className="flex flex-wrap gap-1">
              {(cat === 'aura' ? AURAS : cat === 'armor' ? ARMORS : cat === 'horns' ? HORNS : EYES).map((item) => (
                <button
                  key={item}
                  onClick={() => buyCosmetic(cat, item, item === 'none' || item === 'default' ? 0 : 10)}
                  className={`theme-btn text-xs px-2 py-1 ${state.cosmetics[cat] === item ? 'theme-btn-primary' : ''}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
