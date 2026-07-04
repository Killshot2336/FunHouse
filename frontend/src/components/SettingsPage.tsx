import { useAuthStore, useNotificationStore } from '../stores';
import { useSettingsStore } from '../stores/settings';

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { resetDevice } = useAuthStore();
  const { show } = useNotificationStore();
  const {
    soundEnabled, reducedMotion, gameNotifications,
    setSoundEnabled, setReducedMotion, setGameNotifications,
  } = useSettingsStore();

  const clearCache = async () => {
    localStorage.removeItem('funhouse-auth');
    localStorage.removeItem('funhouse-install-dismissed');
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg tracking-wider glow-text">Settings</h2>
        <button onClick={onClose} className="theme-btn text-xs px-3 py-1">Close</button>
      </div>

      <div className="theme-card p-4 space-y-4">
        <h3 className="text-sm font-bold opacity-70">Preferences</h3>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Sound effects</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`theme-btn text-xs px-3 py-1 ${soundEnabled ? 'theme-btn-primary' : ''}`}
          >
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Reduced motion</span>
          <select
            value={reducedMotion === null ? 'system' : reducedMotion ? 'on' : 'off'}
            onChange={(e) => {
              const v = e.target.value;
              setReducedMotion(v === 'system' ? null : v === 'on');
            }}
            className="p-2 bg-transparent border border-current rounded text-xs"
          >
            <option value="system">System default</option>
            <option value="on">Always reduce</option>
            <option value="off">Full animations</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Game notifications</span>
          <button
            onClick={() => setGameNotifications(!gameNotifications)}
            className={`theme-btn text-xs px-3 py-1 ${gameNotifications ? 'theme-btn-primary' : ''}`}
          >
            {gameNotifications ? 'ON' : 'OFF'}
          </button>
        </label>
      </div>

      <div className="theme-card p-4 space-y-3">
        <h3 className="text-sm font-bold opacity-70">Device</h3>
        <p className="text-xs opacity-50">Switch who is using this device without losing household data.</p>
        <button
          onClick={() => { resetDevice(); onClose(); show('Device reset — tap your name again', 'info'); }}
          className="theme-btn w-full text-sm py-2"
        >
          Switch Person
        </button>
      </div>

      <div className="theme-card p-4 space-y-3">
        <h3 className="text-sm font-bold opacity-70">Troubleshooting</h3>
        <p className="text-xs opacity-50">Fix white screens or stale cached data.</p>
        <button onClick={clearCache} className="theme-btn w-full text-sm py-2">
          Clear Cache & Reload
        </button>
      </div>
    </div>
  );
}
