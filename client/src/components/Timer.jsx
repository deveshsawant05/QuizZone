import React, { useState, useEffect, useRef } from 'react';

const Timer = ({ 
  duration, 
  onTimeExpired, 
  mode = 'countdown', 
  className = '',
  warningThreshold = 10, // seconds
  syncTimestamp
}) => {
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    // Reset timer if duration changes
    setRemainingTime(duration);
    setIsActive(true);
  }, [duration]);

  useEffect(() => {
    if (isActive && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            if (onTimeExpired) onTimeExpired();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onTimeExpired]);

  // If sync timestamp is provided, synchronize with server time
  useEffect(() => {
    if (syncTimestamp && mode === 'countdown') {
      const serverEndTime = new Date(syncTimestamp).getTime() + duration * 1000;
      const calculateRemaining = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((serverEndTime - now) / 1000));
        setRemainingTime(diff);
        
        if (diff <= 0) {
          clearInterval(timerRef.current);
          setIsActive(false);
          if (onTimeExpired) onTimeExpired();
        }
      };
      
      calculateRemaining(); // Initial calculation
      timerRef.current = setInterval(calculateRemaining, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [syncTimestamp, duration, onTimeExpired]);

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine color based on remaining time
  const getColorClass = () => {
    if (mode === 'countdown') {
      if (remainingTime <= warningThreshold / 2) return 'text-red-600';
      if (remainingTime <= warningThreshold) return 'text-yellow-600';
      return 'text-blue-600';
    }
    return 'text-blue-600';
  };

  return (
    <div className={`font-mono text-lg font-bold ${getColorClass()} ${className}`}>
      {formatTime(mode === 'countdown' ? remainingTime : duration - remainingTime)}
    </div>
  );
};

export default Timer; 