export function TacticalOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="scan-line absolute inset-0" />
      <div className="absolute top-4 right-4 text-2xl opacity-20 animate-pulse">🦅</div>
    </div>
  );
}
