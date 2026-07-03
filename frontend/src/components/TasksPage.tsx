import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useBossStore, useNotificationStore } from '../stores';
import { api, playSound } from '../lib/api';
import { themeCopy } from '../themes/copy';

interface Assignment {
  id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  task?: { name: string; icon: string; description: string };
}

export function TasksPage() {
  const { user, token } = useAuthStore();
  const { triggerDamage, setBoss } = useBossStore();
  const notify = useNotificationStore((s) => s.show);
  const copy = themeCopy[user!.theme];
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [animating, setAnimating] = useState<string | null>(null);

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
  const allTasks = assignments;

  const completeTask = async (id: string) => {
    setCompleting(id);
    setAnimating(id);
    try {
      const res = await api<{ boss?: { current_health: number; max_health: number } }>(`/tasks/complete/${id}`, { method: 'POST' }, token);
      playSound(user!.theme, 'complete');
      triggerDamage();
      if (res.boss) setBoss(res.boss.current_health, res.boss.max_health);
      notify(copy.notifications.taskComplete, 'success');
      await fetchTasks();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setCompleting(null);
      setTimeout(() => setAnimating(null), 600);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-lg tracking-wider">{copy.tasks.title}</h2>

      <div className="space-y-3">
        <h3 className="text-sm uppercase opacity-60">Your Tasks</h3>
        {myTasks.length === 0 ? (
          <p className="opacity-50 text-sm">{copy.tasks.empty}</p>
        ) : (
          myTasks.map((task) => (
            <AnimatePresence key={task.id}>
              <motion.div
                layout
                className={`theme-card p-4 flex items-center gap-4 ${task.completed ? 'opacity-40' : ''} ${animating === task.id ? 'damage-flash' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-2xl">{task.task?.icon || '📋'}</span>
                <div className="flex-1">
                  <div className="font-bold">{task.task?.name}</div>
                  <div className="text-xs opacity-60">{task.task?.description}</div>
                </div>
                {!task.completed && (
                  <button
                    onClick={() => completeTask(task.id)}
                    disabled={completing === task.id}
                    className="theme-btn theme-btn-primary text-xs"
                  >
                    {completing === task.id ? '...' : copy.tasks.complete}
                  </button>
                )}
                {task.completed && <span className="text-green-400 text-sm">✓ DONE</span>}
              </motion.div>
            </AnimatePresence>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm uppercase opacity-60">Household Progress</h3>
        {allTasks.map((task) => (
          <div key={`all-${task.id}`} className={`theme-card p-3 flex items-center gap-3 text-sm ${task.completed ? 'opacity-40' : ''}`}>
            <span>{task.task?.icon}</span>
            <span className="flex-1">{task.task?.name}</span>
            <span className="text-xs capitalize opacity-60">{task.user_id}</span>
            {task.completed ? '✓' : '○'}
          </div>
        ))}
      </div>
    </div>
  );
}
