import { useGameState } from '../../hooks/useGameState';

interface BuilderState {
  level: number;
  missions: Array<{ id: string; name: string; completed: boolean; reward: number }>;
  outpost: string[];
  resources: number;
}

const MISSIONS = [
  { id: '1', name: 'Build Power Generator', reward: 100 },
  { id: '2', name: 'Establish Water Purifier', reward: 150 },
  { id: '3', name: 'Deploy Defense Turrets', reward: 200 },
  { id: '4', name: 'Construct Comms Array', reward: 250 },
  { id: '5', name: 'Install Medical Bay', reward: 300 },
];

const OUTPOST_PARTS = ['🏛️ Command Center', '⚡ Generator', '💧 Purifier', '🛡️ Turrets', '📡 Comms', '🏥 Med Bay'];

export function DadaBuilder() {
  const defaultState: BuilderState = {
    level: 1,
    missions: MISSIONS.map((m) => ({ ...m, completed: false })),
    outpost: ['🏛️ Command Center'],
    resources: 0,
  };
  const { state, save } = useGameState(defaultState);

  const completeMission = (id: string) => {
    const mission = state.missions.find((m) => m.id === id);
    if (!mission || mission.completed) return;
    const idx = MISSIONS.findIndex((m) => m.id === id);
    const newOutpost = [...state.outpost];
    if (OUTPOST_PARTS[idx + 1]) newOutpost.push(OUTPOST_PARTS[idx + 1]);

    save({
      ...state,
      resources: state.resources + mission.reward,
      level: state.level + 1,
      outpost: newOutpost,
      missions: state.missions.map((m) => m.id === id ? { ...m, completed: true } : m),
    });
  };

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 text-center">
        <div className="text-2xl font-bold">{state.resources} Resources</div>
        <div className="text-xs opacity-60">Outpost Level {state.level}</div>
      </div>

      <div className="theme-card p-4">
        <h3 className="text-sm font-bold mb-3">OUTPOST STATUS</h3>
        <div className="flex flex-wrap gap-2">
          {state.outpost.map((part, i) => (
            <span key={i} className="text-2xl" title={part}>{part.split(' ')[0]}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">ACTIVE MISSIONS</h3>
        {state.missions.map((mission) => (
          <div key={mission.id} className={`theme-card p-4 flex justify-between items-center ${mission.completed ? 'opacity-40' : ''}`}>
            <div>
              <div className="font-bold text-sm">{mission.name}</div>
              <div className="text-xs opacity-60">Reward: {mission.reward} resources</div>
            </div>
            {!mission.completed && (
              <button onClick={() => completeMission(mission.id)} className="theme-btn theme-btn-primary text-xs">
                EXECUTE
              </button>
            )}
            {mission.completed && <span className="text-green-400 text-xs">COMPLETE</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
