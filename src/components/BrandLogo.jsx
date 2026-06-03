import { motion } from 'framer-motion';

const BrandLogo = ({ size = 'md', animated = true, className = '', showTagline = true }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-6xl'
  };

  const taglineSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: -20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, type: 'spring' }}
      className={`flex flex-col items-center ${className}`}
    >
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ duration: 0.3 }}
        className={`${sizeClasses[size]} mb-4 relative cursor-pointer`}
      >
        <img
          src="/logo2.jpeg"
          alt="Daily Basket"
          className="w-full h-full object-contain rounded-2xl shadow-xl"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/112x112?text=🍎';
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#2E7D32]/20 to-[#E53935]/20"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h1 className={`${textSizes[size]} font-['Playfair_Display'] font-black tracking-tight`}>
          <span className="text-[#2E7D32] drop-shadow-sm">Daily</span>{' '}
          <span className="text-[#E53935] drop-shadow-sm">Basket</span>
        </h1>
        
        {showTagline && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`${taglineSizes[size]} text-gray-500 mt-2 font-medium tracking-wide`}
          >
            Fresh Groceries, Delivered Fresh
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BrandLogo;