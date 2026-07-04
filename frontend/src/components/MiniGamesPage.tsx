import { useAuthStore } from '../stores';
import { themeCopy } from '../themes/copy';
import { CommanderVillage } from './games/commander-village/CommanderVillage';

export function MiniGamesPage() {
  const { user } = useAuthStore();
  const copy = themeCopy[user!.theme];

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg tracking-wider">{copy.bored.title}</h2>
      <CommanderVillage />
    </div>
  );
}
