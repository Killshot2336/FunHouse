import { useAuthStore } from '../stores';
import { api } from '../lib/api';

interface ThoughtBubblesProps {
  vents: Array<{ id: string; vent_text: string }>;
}

export function ThoughtBubbles({ vents }: ThoughtBubblesProps) {
  const { token } = useAuthStore();

  const acknowledge = async (id: string) => {
    await api(`/social/vents/${id}/acknowledge`, { method: 'POST' }, token);
  };

  return (
    <div className="space-y-3">
      {vents.map((v) => (
        <div key={v.id} className="thought-bubble cursor-pointer" onClick={() => acknowledge(v.id)}>
          <p className="text-sm italic opacity-80">💭 "{v.vent_text}"</p>
          <p className="text-xs opacity-40 mt-1">tap to acknowledge</p>
        </div>
      ))}
    </div>
  );
}
