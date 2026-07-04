import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  last_cleaning: { id?: string; cleaned_by: string; cleaned_at: string } | null;
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
  const [feedingAnim, setFeedingAnim] = useState(false);

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
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load cats', 'error');
    }
  }, [token, notify]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [fetch]);

  const cleanBox = async (id: string) => {
    try {
      await api(`/cat-care/litter-boxes/${id}/clean`, { method: 'POST' }, token);
      notify('Litter box cleaned!', 'success');
      fetch();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const undoCleaning = async (cleaningId: string) => {
    try {
      await api(`/cat-care/litter-boxes/cleanings/${cleaningId}`, { method: 'DELETE' }, token);
      notify('Cleaning undone', 'info');
      fetch();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cannot undo', 'error');
    }
  };

  const logFeeding = async (names: string[]) => {
    if (!names.length) return;
    setFeedingAnim(true);
    try {
      await api('/cat-care/feeding', {
        method: 'POST',
        body: JSON.stringify({ cat_names: names }),
      }, token);
      setSelectedCats([]);
      notify('Feeding logged!', 'success');
      fetch();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setTimeout(() => setFeedingAnim(false), 600);
    }
  };

  const undoFeeding = async (logId: string) => {
    try {
      await api(`/cat-care/feeding/${logId}`, { method: 'DELETE' }, token);
      notify('Feeding undone — like it never happened', 'info');
      fetch();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cannot undo', 'error');
    }
  };

  const toggleCat = (name: string) => {
    setSelectedCats((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-bold text-xl mb-4 glow-text tracking-widest">{copy.catCare.litter}</h2>
        <div className="space-y-3">
          {boxes.length === 0 ? (
            <p className="text-sm opacity-50 animate-pulse">Loading litter boxes...</p>
          ) : boxes.map((box, i) => (
            <motion.div
              key={box.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`theme-card p-4 card-glow ${getUrgencyClass(box.urgency)}`}
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-bold">{box.name}</div>
                  <div className="text-xs opacity-60">{box.location}</div>
                  {box.last_cleaning ? (
                    <div className="text-xs mt-1 opacity-60 flex items-center gap-2 flex-wrap">
                      <span>Last: {box.last_cleaning.cleaned_by} — {formatRelativeTime(box.last_cleaning.cleaned_at)}</span>
                      {box.last_cleaning.cleaned_by === user!.username && box.last_cleaning.id && (
                        <button onClick={() => undoCleaning(box.last_cleaning!.id!)} className="theme-btn text-[10px] px-2 py-0.5 opacity-60">
                          Undo
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs mt-1 text-red-400 animate-pulse">Never cleaned!</div>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => cleanBox(box.id)}
                  className="theme-btn theme-btn-primary text-xs"
                >
                  {copy.catCare.clean}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="font-bold text-xl mb-4 glow-text tracking-widest">{copy.catCare.feeding}</h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {cats.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: selectedCats.includes(cat.name) ? 1.08 : 1,
                opacity: 1,
                y: feedingAnim ? [0, -8, 0] : 0,
              }}
              transition={{ delay: i * 0.1 }}
              onClick={() => toggleCat(cat.name)}
              className={`theme-card px-5 py-4 flex items-center gap-3 card-glow transition-all ${
                selectedCats.includes(cat.name) ? 'border-2 border-current ring-2 ring-current/30' : 'opacity-80'
              }`}
            >
              <motion.span
                className="text-3xl"
                animate={{ rotate: selectedCats.includes(cat.name) ? [0, -5, 5, 0] : 0 }}
                transition={{ repeat: selectedCats.includes(cat.name) ? Infinity : 0, duration: 2 }}
              >
                {CAT_EMOJI[cat.color] || '🐱'}
              </motion.span>
              <div className="text-left">
                <div className="font-bold">{cat.name}</div>
                <div className="text-xs opacity-60 capitalize">{cat.color} cat</div>
              </div>
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => logFeeding(cats.map((c) => c.name))}
            className="theme-btn text-xs px-4 self-center"
          >
            Feed Both
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => logFeeding(selectedCats)}
          disabled={!selectedCats.length}
          className="theme-btn theme-btn-primary w-full text-sm mb-4 py-3"
        >
          {copy.catCare.feed} {selectedCats.length ? `(${selectedCats.join(', ')})` : ''}
        </motion.button>

        <div className="space-y-2">
          {feedings.slice(0, 10).map((log) => (
            <motion.div
              key={log.id}
              layout
              className={`theme-card p-3 text-sm flex items-center justify-between gap-2 ${getUrgencyClass(log.urgency)}`}
            >
              <div>
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
              {log.fed_by === user!.username && (
                <button onClick={() => undoFeeding(log.id)} className="theme-btn text-[10px] px-2 py-0.5 shrink-0 opacity-60">
                  Undo
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
