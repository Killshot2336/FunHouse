import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useNotificationStore } from '../stores';
import { useCinematicStore } from '../stores/cinematic';
import { themeCopy, userProfiles } from '../themes/copy';
import { Dashboard } from './Dashboard';
import { TasksPage } from './TasksPage';
import { CatCarePage } from './CatCarePage';
import { FinancePage } from './FinancePage';
import { MiniGamesPage } from './MiniGamesPage';
import { StashPage } from './StashPage';
import { HoloCard } from './effects/HoloCard';

type Page = 'dashboard' | 'tasks' | 'cats' | 'finance' | 'bored' | 'stash';

const pageVariants = {
  initial: { opacity: 0, x: 30, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -30, filter: 'blur(8px)' },
};

export function Layout() {
  const { user, demoMode, resetDevice } = useAuthStore();
  const { message, type, clear, show } = useNotificationStore();
  const { triggerFlash } = useCinematicStore();
  const copy = themeCopy[user!.theme];
  const [page, setPage] = useState<Page>('dashboard');
  const [showReset, setShowReset] = useState(false);

  const handleResetDevice = () => {
    resetDevice();
    setShowReset(false);
    show('Device reset — tap your name again', 'info');
  };

  const switchPage = (key: Page) => {
    if (key !== page) {
      triggerFlash('success');
      setPage(key);
    }
  };

  const navItems: { key: Page; label: string; icon: string; hidden?: boolean }[] = [
    { key: 'dashboard', label: copy.nav.dashboard, icon: '🏠' },
    { key: 'tasks', label: copy.nav.tasks, icon: '📋' },
    { key: 'cats', label: copy.nav.cats, icon: '🐱' },
    { key: 'finance', label: copy.nav.bills, icon: '💰' },
    { key: 'bored', label: copy.nav.bored, icon: '🌀' },
    { key: 'stash', label: copy.nav.stash, icon: '🌿', hidden: user!.username === 'jamie' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="holo-card m-3 p-3 flex items-center justify-between sticky top-0 z-50"
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6 }}
          >
            {userProfiles[user!.username].emoji}
          </motion.span>
          <div>
            <div className="font-bold text-sm tracking-[0.2em] glow-text">{copy.appName}</div>
            <div className="text-xs opacity-50">{user!.displayName} // ONLINE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && <span className="text-[10px] opacity-40 border border-current px-2 py-0.5 rounded tracking-wider">DEMO</span>}
          <button onClick={() => setShowReset(true)} className="theme-btn text-xs px-2 py-1 opacity-40 hover:opacity-100">⚙️</button>
        </div>
      </motion.header>

      {showReset && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <HoloCard intense className="w-full max-w-sm">
            <div className="p-6">
              <h3 className="font-bold mb-2 glow-text">Wrong person?</h3>
              <p className="text-sm opacity-70 mb-4">Reset clears this device so someone else can tap their name.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowReset(false)} className="theme-btn flex-1 py-2">Cancel</button>
                <button onClick={handleResetDevice} className="theme-btn theme-btn-primary flex-1 py-2">Reset</button>
              </div>
            </div>
          </HoloCard>
        </div>
      )}

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-4 p-3 rounded-lg text-sm text-center cursor-pointer holo-card ${
              type === 'success' ? 'border-green-500/50' : type === 'error' ? 'border-red-500/50' : ''
            }`}
            onClick={clear}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-4 pb-28 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {page === 'dashboard' && <Dashboard />}
            {page === 'tasks' && <TasksPage />}
            {page === 'cats' && <CatCarePage />}
            {page === 'finance' && <FinancePage />}
            {page === 'bored' && <MiniGamesPage />}
            {page === 'stash' && <StashPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="nav-dock fixed bottom-3 left-3 right-3 z-50">
        <div className="holo-card p-2 flex justify-around">
          {navItems.filter((n) => !n.hidden).map((item) => (
            <motion.button
              key={item.key}
              onClick={() => switchPage(item.key)}
              whileTap={{ scale: 0.85 }}
              className={`nav-item flex flex-col items-center p-2 rounded-lg transition-all relative ${
                page === item.key ? 'nav-item-active' : 'opacity-40'
              }`}
            >
              {page === item.key && <motion.div layoutId="nav-glow" className="nav-glow-trail" />}
              <span className="text-xl relative z-10">{item.icon}</span>
              <span className="text-[9px] mt-0.5 tracking-wider relative z-10">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}
