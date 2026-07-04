interface GameIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'text-lg', md: 'text-2xl', lg: 'text-5xl' };

/** Themed icon wrapper — emoji today, SVG-ready */
export function GameIcon({ icon, size = 'md', className = '' }: GameIconProps) {
  return (
    <span className={`game-icon inline-flex items-center justify-center ${SIZES[size]} ${className}`} role="img">
      {icon}
    </span>
  );
}
