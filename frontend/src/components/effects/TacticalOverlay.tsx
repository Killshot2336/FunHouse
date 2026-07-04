export function TacticalOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="scan-line absolute inset-0" />
      <div className="hud-corner hud-tl" />
      <div className="hud-corner hud-tr" />
      <div className="hud-corner hud-bl" />
      <div className="hud-corner hud-br" />
      <div className="hud-reticle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-4 left-4 text-[10px] opacity-30 font-mono tracking-widest">
        ENCLAVE TACTICAL NET // ONLINE
      </div>
      <div className="absolute top-4 right-4 text-2xl opacity-20 animate-pulse">🦅</div>
      <div className="absolute bottom-20 left-4 text-[10px] opacity-20 font-mono">
        THREAT LEVEL: <span className="text-red-400">MODERATE</span>
      </div>
    </div>
  );
}
