import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../stores';
import { themeCopy, userProfiles } from '../themes/copy';
import { Dashboard } from './Dashboard';
import { TasksPage } from './TasksPage';
import { CatCarePage } from './CatCarePage';
import { FinancePage } from './FinancePage';
import { MiniGamesPage } from './MiniGamesPage';
import { StashPage } from './StashPage';

type Page = 'dashboard' | 'tasks' | 'cats' | 'finance' | 'bored' | 'stash';

export function Layout() {
  const { user, demoMode, resetDevice } = useAuthStore();
  const { message, type, clear, show } = useNotificationStore();
  const copy = themeCopy[user!.theme];
  const [page, setPage] = useState<Page>('dashboard');
  const [showReset, setShowReset] = useState(false);

  const handleResetDevice = () => {
    resetDevice();
    setShowReset(false);
    show('Device reset — tap your name again', 'info');
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
      {/* Header */}
      <header className="theme-card m-2 p-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">{userProfiles[user!.username].emoji}</span>
          <div>
            <div className="font-bold text-sm tracking-wider">{copy.appName}</div>
            <div className="text-xs opacity-60">{user!.displayName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && <span className="text-xs opacity-40 border border-current px-1 rounded">DEMO</span>}
          <button
            onClick={() => setShowReset(true)}
            className="theme-btn text-xs px-2 py-1 opacity-40 hover:opacity-100"
            title="Reset device identity"
          >
            ⚙️
          </button>
        </div>
      </header>

      {showReset && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="theme-card p-6 w-full max-w-sm">
            <h3 className="font-bold mb-2">Wrong person on this device?</h3>
            <p className="text-sm opacity-70 mb-4">
              Reset clears this phone&apos;s identity so someone else can tap their name.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)} className="theme-btn flex-1 py-2">Cancel</button>
              <button onClick={handleResetDevice} className="theme-btn theme-btn-primary flex-1 py-2">Reset device</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification toast */}
      {message && (
        <div
          className={`mx-4 p-3 rounded text-sm text-center cursor-pointer ${
            type === 'success' ? 'border border-green-500' : type === 'error' ? 'border border-red-500' : 'border border-current'
          }`}
          onClick={clear}
        >
          {message}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {page === 'dashboard' && <Dashboard />}
        {page === 'tasks' && <TasksPage />}
        {page === 'cats' && <CatCarePage />}
        {page === 'finance' && <FinancePage />}
        {page === 'bored' && <MiniGamesPage />}
        {page === 'stash' && <StashPage />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 theme-card m-2 p-2 flex justify-around z-50 backdrop-blur-lg">
        {navItems.filter((n) => !n.hidden).map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`flex flex-col items-center p-2 rounded transition-all ${
              page === item.key ? 'opacity-100 scale-110 nav-active' : 'opacity-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
