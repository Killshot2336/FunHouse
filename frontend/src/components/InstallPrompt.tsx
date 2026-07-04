import { useState, useEffect } from 'react';

const DISMISS_KEY = 'funhouse-install-dismissed';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="theme-card p-6 w-full max-w-sm mb-8 animate-in">
        <h2 className="font-bold text-lg mb-2">Install Funhouse</h2>
        <p className="text-sm opacity-80 mb-4">
          Add Funhouse to your home screen for the full app experience — no browser bars, works like a native app.
        </p>
        <ol className="text-sm space-y-2 mb-6 opacity-90">
          <li>1. Tap the <strong>Share</strong> button <span className="text-lg">⬆️</span> in Safari</li>
          <li>2. Scroll down and tap <strong>Add to Home Screen</strong></li>
          <li>3. Tap <strong>Add</strong></li>
        </ol>
        <button onClick={dismiss} className="theme-btn theme-btn-primary w-full py-3 font-bold">
          Got it
        </button>
      </div>
    </div>
  );
}
