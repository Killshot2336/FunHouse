import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../stores';
import { api } from '../lib/api';
import { themeCopy } from '../themes/copy';

interface MoodRingProps {
  moods: Array<{ user_id: string; mood: string }>;
}

export function MoodRing({ moods: _moods }: MoodRingProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[user!.theme];
  const [selected, setSelected] = useState<string | null>(null);
  const [ventText, setVentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api('/social/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: selected, vent_text: selected === 'not_great' ? ventText : undefined }),
      }, token);
      notify('Mood recorded', 'success');
      setSelected(null);
      setVentText('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const moods = [
    { key: 'good', label: copy.mood.good, emoji: '😊' },
    { key: 'meh', label: copy.mood.meh, emoji: '😐' },
    { key: 'not_great', label: copy.mood.notGreat, emoji: '😔' },
  ];

  return (
    <div className="theme-card p-4">
      <h3 className="font-bold mb-3 text-sm uppercase tracking-wider">{copy.mood.title}</h3>
      <div className="flex gap-3 justify-center mb-4">
        {moods.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelected(m.key)}
            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
              selected === m.key ? 'border-current scale-105' : 'border-transparent opacity-60'
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs mt-1">{m.label}</span>
          </button>
        ))}
      </div>

      {selected === 'not_great' && (
        <textarea
          value={ventText}
          onChange={(e) => setVentText(e.target.value)}
          placeholder={copy.mood.vent}
          className="w-full p-3 bg-transparent border border-current rounded text-sm mb-3 opacity-80"
          rows={3}
        />
      )}

      {selected && (
        <button onClick={handleSubmit} disabled={submitting} className="theme-btn theme-btn-primary w-full">
          {submitting ? 'SUBMITTING...' : 'SUBMIT'}
        </button>
      )}
    </div>
  );
}
