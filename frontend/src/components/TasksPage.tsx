import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useBossStore, useNotificationStore } from '../stores';
import { useCinematicStore } from '../stores/cinematic';
import { api, playSound } from '../lib/api';
import { themeCopy } from '../themes/copy';

interface Assignment {
  id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  completed_by?: string;
  task?: { name: string; icon: string; description: string };
  master_tasks?: { name: string; icon: string; description: string };
}

function getTask(a: Assignment) {
  return a.task || a.master_tasks;
}

export function TasksPage() {
  const { user, token } = useAuthStore();
  const { triggerDamage } = useBossStore();
  const notify = useNotificationStore((s) => s.show);
  const { triggerShake, triggerFlash, burst: spawnBurst } = useCinematicStore();
  const copy = themeCopy[user!.theme];
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [animating, setAnimating] = useState<string | null>(null);
  const [burstTaskId, setBurstTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api<Assignment[]>('/tasks/daily', {}, token);
      setAssignments(data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const myTasks = assignments.filter((a) => a.user_id === user!.username);

  const completeTask = async (id: string) => {
    setCompleting(id);
    setAnimating(id);
    setBurstTaskId(id);
    try {
      await api(`/tasks/complete/${id}`, { method: 'POST' }, token);
      playSound(user!.theme, 'complete');
      triggerDamage();
      triggerShake();
      triggerFlash('success');
      spawnBurst(50, 50, 50);
      notify(copy.notifications.taskComplete, 'success');
      await fetchTasks();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setCompleting(null);
      setTimeout(() => { setAnimating(null); setBurstTaskId(null); }, 800);
    }
  };

  const undoTask = async (id: string) => {
    try {
      await api(`/tasks/undo/${id}`, { method: 'POST' }, token);
      notify('Task undone — like it never happened', 'info');
      await fetchTasks();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cannot undo', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <motion.h2
        className="font-bold text-xl tracking-widest glow-text"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {copy.tasks.title}
      </motion.h2>

      <div className="space-y-3">
        <h3 className="text-sm uppercase opacity-60 tracking-wider">Your Tasks</h3>
        {myTasks.length === 0 ? (
          <p className="opacity-50 text-sm animate-pulse">{copy.tasks.empty}</p>
        ) : (
          myTasks.map((task, i) => {
            const t = getTask(task);
            return (
              <AnimatePresence key={task.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`theme-card p-4 flex items-center gap-4 card-glow ${task.completed ? 'opacity-50' : ''} ${animating === task.id ? 'damage-flash' : ''}`}
                >
                  {burstTaskId === task.id && <div className="action-burst" />}
                  <motion.span
                    className="text-3xl"
                    animate={animating === task.id ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
                  >
                    {t?.icon || '📋'}
                  </motion.span>
                  <div className="flex-1">
                    <div className="font-bold tracking-wide">{t?.name || 'Task'}</div>
                    <div className="text-xs opacity-60">{t?.description}</div>
                  </div>
                  {!task.completed ? (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => completeTask(task.id)}
                      disabled={completing === task.id}
                      className="theme-btn theme-btn-primary text-xs px-4 py-2"
                    >
                      {completing === task.id ? '...' : copy.tasks.complete}
                    </motion.button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm font-bold">✓ DONE</span>
                      {task.completed_by === user!.username && (
                        <button onClick={() => undoTask(task.id)} className="theme-btn text-xs opacity-60 hover:opacity-100">
                          Undo
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            );
          })
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm uppercase opacity-60 tracking-wider">Household Progress</h3>
        {assignments.map((task) => {
          const t = getTask(task);
          return (
            <motion.div
              key={`all-${task.id}`}
              layout
              className={`theme-card p-3 flex items-center gap-3 text-sm ${task.completed ? 'opacity-40 line-through' : ''}`}
            >
              <span>{t?.icon}</span>
              <span className="flex-1">{t?.name}</span>
              <span className="text-xs capitalize opacity-60">{task.user_id}</span>
              {task.completed ? '✓' : '○'}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
