const RUNES = ['᚛', '᚜', 'ᛟ', 'ᛞ', 'ᛉ', 'ᚨ', 'ᚦ', 'ᚱ'];

export function ArcaneMist() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="arcane-wisp absolute rounded-full blur-2xl"
          style={{
            width: 120 + i * 40,
            height: 80 + i * 30,
            left: `${5 + i * 12}%`,
            top: `${15 + i * 10}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
      {RUNES.map((rune, i) => (
        <div
          key={rune}
          className="arcane-rune absolute text-2xl opacity-20"
          style={{
            left: `${10 + i * 11}%`,
            top: `${30 + (i % 3) * 20}%`,
            animationDelay: `${i * 1.2}s`,
          }}
        >
          {rune}
        </div>
      ))}
      <div className="arcane-sigil absolute top-1/4 left-1/2 -translate-x-1/2 opacity-10 text-8xl">☽</div>
    </div>
  );
}
