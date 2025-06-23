import React, { useEffect, useState } from 'react';
import { Text, TextProps } from '../typography/Text';

interface CountdownTimerProps extends Omit<TextProps, 'children'> {
  duration: number; // Duration in milliseconds
  onComplete?: () => void;
  format?: 'mm:ss' | 'ss';
}

export function CountdownTimer({ 
  duration, 
  onComplete, 
  format = 'mm:ss',
  ...textProps 
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(Math.floor(duration / 1000));

  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onComplete]);

  const formatTime = (seconds: number): string => {
    if (format === 'ss') {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return <Text {...textProps}>{formatTime(timeRemaining)}</Text>;
}