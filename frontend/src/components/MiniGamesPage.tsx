import { useAuthStore } from '../stores';
import { themeCopy } from '../themes/copy';
import { EdwardClicker } from './games/EdwardClicker';
import { DadaBuilder } from './games/DadaBuilder';
import { JamieMirror } from './games/JamieMirror';

export function MiniGamesPage() {
  const { user } = useAuthStore();
  const copy = themeCopy[user!.theme];

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg tracking-wider">{copy.bored.title}</h2>
      {user!.username === 'edward' && <EdwardClicker />}
      {user!.username === 'dada' && <DadaBuilder />}
      {user!.username === 'jamie' && <JamieMirror />}
    </div>
  );
}
