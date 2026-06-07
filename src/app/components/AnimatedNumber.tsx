import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
}

export default function AnimatedNumber({ value }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 300;
    const steps = 20;
    const stepTime = duration / steps;
    const increment = (value - displayValue) / steps;

    let current = displayValue;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1.2, color: '#f5f5f0' }}
      animate={{ scale: 1, color: '#92d020' }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  );
}
