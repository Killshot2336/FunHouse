export function ArcaneMist() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="arcane-wisp absolute rounded-full blur-2xl"
          style={{
            width: 120 + i * 40,
            height: 80 + i * 30,
            left: `${10 + i * 18}%`,
            top: `${20 + i * 12}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}
