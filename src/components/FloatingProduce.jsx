import { motion } from 'framer-motion';

const produceItems = [
  { emoji: '🍎', size: 'text-4xl', left: '5%', top: '10%', delay: 0, duration: 6 },
  { emoji: '🥑', size: 'text-5xl', left: '85%', top: '20%', delay: 1, duration: 7 },
  { emoji: '🍊', size: 'text-4xl', left: '10%', top: '60%', delay: 2, duration: 5 },
  { emoji: '🥬', size: 'text-5xl', left: '90%', top: '70%', delay: 0.5, duration: 8 },
  { emoji: '🍓', size: 'text-3xl', left: '15%', top: '30%', delay: 1.5, duration: 5.5 },
  { emoji: '🥕', size: 'text-4xl', left: '80%', top: '40%', delay: 3, duration: 6.5 },
  { emoji: '🍇', size: 'text-3xl', left: '20%', top: '80%', delay: 2.5, duration: 7.5 },
  { emoji: '🍅', size: 'text-5xl', left: '70%', top: '15%', delay: 0.8, duration: 6.8 },
  { emoji: '🥝', size: 'text-3xl', left: '25%', top: '50%', delay: 4, duration: 5.8 },
  { emoji: '🍐', size: 'text-4xl', left: '75%', top: '85%', delay: 1.2, duration: 7.2 },
  { emoji: '🥦', size: 'text-4xl', left: '55%', top: '90%', delay: 3.5, duration: 5.5 },
  { emoji: '🍑', size: 'text-3xl', left: '35%', top: '25%', delay: 0.3, duration: 8.3 },
  { emoji: '🍒', size: 'text-4xl', left: '65%', top: '55%', delay: 1.8, duration: 6.8 },
  { emoji: '🍋', size: 'text-3xl', left: '40%', top: '75%', delay: 2.8, duration: 5.2 },
  { emoji: '🥭', size: 'text-5xl', left: '60%', top: '35%', delay: 4.2, duration: 7.8 },
];

const FloatingProduce = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {produceItems.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.size} filter drop-shadow-2xl opacity-40`}
          style={{
            left: item.left,
            top: item.top,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingProduce;