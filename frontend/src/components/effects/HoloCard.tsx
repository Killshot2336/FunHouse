import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface HoloCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  intense?: boolean;
  onClick?: () => void;
}

export function HoloCard({ children, className = '', delay = 0, intense = false, onClick }: HoloCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 120 }}
      whileHover={{ scale: onClick ? 1.02 : 1.01, y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`holo-card ${intense ? 'holo-card-intense' : ''} ${className}`}
    >
      <div className="holo-card-border" />
      <div className="holo-card-shine" />
      <div className="holo-card-content relative z-10">{children}</div>
    </motion.div>
  );
}
