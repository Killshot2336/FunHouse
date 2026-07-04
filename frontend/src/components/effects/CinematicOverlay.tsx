import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicStore } from '../../stores/cinematic';

export function CinematicOverlay() {
  const { shaking, flash, particles, tickParticles } = useCinematicStore();

  useEffect(() => {
    if (particles.length === 0) return;
    const id = setInterval(tickParticles, 32);
    return () => clearInterval(id);
  }, [particles.length, tickParticles]);

  return (
    <>
      <motion.div
        className="cinematic-grain fixed inset-0 pointer-events-none z-[200]"
        animate={shaking ? { x: [0, -6, 8, -4, 6, -2, 0], y: [0, 4, -6, 3, -4, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.45 }}
      />

      <AnimatePresence>
        {flash !== 'none' && (
          <motion.div
            key={flash}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`cinematic-flash cinematic-flash-${flash} fixed inset-0 pointer-events-none z-[199]`}
          />
        )}
      </AnimatePresence>

      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[198]" style={{ overflow: 'visible' }}>
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size * p.life}
            fill={p.color}
            opacity={p.life}
          />
        ))}
      </svg>

      <div className="cinematic-vignette fixed inset-0 pointer-events-none z-[5]" />
    </>
  );
}
