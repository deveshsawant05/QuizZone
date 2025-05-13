import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TimerControl = ({ timeLimit, isPaused }) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [timerPercentage, setTimerPercentage] = useState(100);
  
  // Start countdown when component mounts
  useEffect(() => {
    setTimeRemaining(timeLimit);
    setTimerPercentage(100);
    
    // Only run timer if not paused
    if (!isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeLimit, isPaused]);
  
  // Update the progress bar
  useEffect(() => {
    setTimerPercentage((timeRemaining / timeLimit) * 100);
  }, [timeRemaining, timeLimit]);
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Determine color based on time remaining
  const getTimerColor = () => {
    if (timerPercentage > 50) return 'bg-blue-500';
    if (timerPercentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between items-center">
        <span className="font-medium">Time Remaining</span>
        <span className={`text-lg font-bold ${timerPercentage <= 20 ? 'text-red-600' : ''}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div 
          className={`h-4 rounded-full ${getTimerColor()}`}
          style={{ width: `${timerPercentage}%` }}
        ></div>
      </div>
      
      {isPaused && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Timer is paused
        </div>
      )}
    </div>
  );
};

TimerControl.propTypes = {
  timeLimit: PropTypes.number.isRequired,
  isPaused: PropTypes.bool
};

TimerControl.defaultProps = {
  isPaused: false
};

export default TimerControl; 