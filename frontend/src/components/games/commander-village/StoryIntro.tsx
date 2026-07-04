import { useState } from 'react';
import { motion } from 'framer-motion';

interface StoryIntroProps {
  story: { title: string; text: string };
  patron: string;
  onComplete: () => void;
}

export function StoryIntro({ story, patron, onComplete }: StoryIntroProps) {
  const [revealed, setRevealed] = useState(false);

  const patronEmoji = patron === 'rick' ? '🧪' : patron === 'enclave' ? '🦅' : '🔮';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="theme-card p-8 text-center max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="text-6xl mb-4"
      >
        {patronEmoji}
      </motion.div>
      <h2 className="font-bold text-lg tracking-wider mb-4 glitch-text">{story.title}</h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        className="text-sm opacity-80 italic leading-relaxed mb-6"
        onAnimationComplete={() => setRevealed(true)}
      >
        {story.text}
      </motion.p>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={onComplete}
        className="theme-btn theme-btn-primary px-8 py-3 font-bold"
      >
        BEGIN YOUR COMMAND
      </motion.button>
    </motion.div>
  );
}
