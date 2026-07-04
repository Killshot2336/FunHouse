import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useNotificationStore } from '../stores';
import { api, getUrgencyClass, formatRelativeTime } from '../lib/api';
import { themeCopy } from '../themes/copy';

interface Cat {
  id: string;
  name: string;
  color: string;
  owner_ids: string[];
}

interface LitterBox {
  id: string;
  name: string;
  location: string;
  last_cleaning: { cleaned_by: string; cleaned_at: string } | null;
  urgency: string;
}

interface FeedingLog {
  id: string;
  cat_names: string[];
  fed_by: string;
  fed_at: string;
  urgency: string;
}

const CAT_EMOJI: Record<string, string> = { black: '🐈‍⬛', grey: '🐈' };

export function CatCarePage() {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[user!.theme];
  const [cats, setCats] = useState<Cat[]>([]);
  const [boxes, setBoxes] = useState<LitterBox[]>([]);
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const fetch = useCallback(async () => {
    try {
      const [c, b, f] = await Promise.all([
        api<Cat[]>('/cat-care/cats', {}, token),
        api<LitterBox[]>('/cat-care/litter-boxes', {}, token),
        api<FeedingLog[]>('/cat-care/feeding', {}, token),
      ]);
      setCats(c);
      setBoxes(b);
      setFeedings(f);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [fetch]);

  const cleanBox = async (id: string) => {
    await api(`/cat-care/litter-boxes/${id}/clean`, { method: 'POST' }, token);
    notify('Litter box cleaned!', 'success');
    fetch();
  };

  const logFeeding = async (names: string[]) => {
    if (!names.length) return;
    await api('/cat-care/feeding', {
      method: 'POST',
      body: JSON.stringify({ cat_names: names }),
    }, token);
    setSelectedCats([]);
    notify('Feeding logged!', 'success');
    fetch();
  };

  const toggleCat = (name: string) => {
    setSelectedCats((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const feedBoth = () => logFeeding(cats.map((c) => c.name));

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold text-lg mb-4">{copy.catCare.litter}</h2>
        <div className="space-y-3">
          {boxes.map((box) => (
            <div key={box.id} className={`theme-card p-4 ${getUrgencyClass(box.urgency)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{box.name}</div>
                  <div className="text-xs opacity-60">{box.location}</div>
                  {box.last_cleaning ? (
                    <div className="text-xs mt-1 opacity-60">
                      Last: {box.last_cleaning.cleaned_by} — {formatRelativeTime(box.last_cleaning.cleaned_at)}
                    </div>
                  ) : (
                    <div className="text-xs mt-1 text-red-400">Never cleaned!</div>
                  )}
                </div>
                <button onClick={() => cleanBox(box.id)} className="theme-btn text-xs">
                  {copy.catCare.clean}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-4">{copy.catCare.feeding}</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCat(cat.name)}
              className={`theme-card px-4 py-3 flex items-center gap-2 transition-all ${
                selectedCats.includes(cat.name) ? 'scale-105 border-2 border-current' : 'opacity-70'
              }`}
            >
              <span className="text-xl">{CAT_EMOJI[cat.color] || '🐱'}</span>
              <div className="text-left">
                <div className="font-bold text-sm">{cat.name}</div>
                <div className="text-xs opacity-60 capitalize">{cat.color}</div>
              </div>
            </button>
          ))}
          <button onClick={feedBoth} className="theme-btn text-xs px-4">
            Feed Both
          </button>
        </div>

        <button
          onClick={() => logFeeding(selectedCats)}
          disabled={!selectedCats.length}
          className="theme-btn theme-btn-primary w-full text-sm mb-4"
        >
          {copy.catCare.feed} {selectedCats.length ? `(${selectedCats.join(', ')})` : ''}
        </button>

        <div className="space-y-2">
          {feedings.slice(0, 10).map((log) => (
            <div key={log.id} className={`theme-card p-3 text-sm ${getUrgencyClass(log.urgency)}`}>
              {log.cat_names.map((name) => {
                const cat = cats.find((c) => c.name === name);
                return (
                  <span key={name} className="mr-2">
                    {cat ? CAT_EMOJI[cat.color] : '🐱'} {name}
                  </span>
                );
              })}
              <span className="opacity-60 ml-2">by {log.fed_by}</span>
              <span className="opacity-40 ml-2">{formatRelativeTime(log.fed_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
