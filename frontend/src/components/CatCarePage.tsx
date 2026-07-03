import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useNotificationStore } from '../stores';
import { api, getUrgencyClass, formatRelativeTime } from '../lib/api';
import { themeCopy } from '../themes/copy';

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

export function CatCarePage() {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[user!.theme];
  const [boxes, setBoxes] = useState<LitterBox[]>([]);
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [newBoxName, setNewBoxName] = useState('');
  const [catNames, setCatNames] = useState('');

  const fetch = useCallback(async () => {
    try {
      const [b, f] = await Promise.all([
        api<LitterBox[]>('/cat-care/litter-boxes', {}, token),
        api<FeedingLog[]>('/cat-care/feeding', {}, token),
      ]);
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

  const logFeeding = async () => {
    if (!catNames.trim()) return;
    await api('/cat-care/feeding', {
      method: 'POST',
      body: JSON.stringify({ cat_names: catNames.split(',').map((s) => s.trim()) }),
    }, token);
    setCatNames('');
    notify('Feeding logged!', 'success');
    fetch();
  };

  const addBox = async () => {
    if (!newBoxName.trim()) return;
    await api('/cat-care/litter-boxes', {
      method: 'POST',
      body: JSON.stringify({ name: newBoxName, location: 'House' }),
    }, token);
    setNewBoxName('');
    fetch();
  };

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
        <div className="flex gap-2 mt-3">
          <input
            value={newBoxName}
            onChange={(e) => setNewBoxName(e.target.value)}
            placeholder="New box name"
            className="flex-1 p-2 bg-transparent border border-current rounded text-sm"
          />
          <button onClick={addBox} className="theme-btn text-xs">+ Add</button>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-4">{copy.catCare.feeding}</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={catNames}
            onChange={(e) => setCatNames(e.target.value)}
            placeholder="Cat names (comma separated)"
            className="flex-1 p-2 bg-transparent border border-current rounded text-sm"
          />
          <button onClick={logFeeding} className="theme-btn theme-btn-primary text-xs">
            {copy.catCare.feed}
          </button>
        </div>
        <div className="space-y-2">
          {feedings.slice(0, 10).map((log) => (
            <div key={log.id} className={`theme-card p-3 text-sm ${getUrgencyClass(log.urgency)}`}>
              <span>🐱 {log.cat_names.join(', ')}</span>
              <span className="opacity-60 ml-2">by {log.fed_by}</span>
              <span className="opacity-40 ml-2">{formatRelativeTime(log.fed_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
