import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const LiveLeaderboard = ({ leaderboard, currentUserId }) => {
  const [animatedLeaderboard, setAnimatedLeaderboard] = useState([]);
  
  // Add animation when leaderboard changes
  useEffect(() => {
    setAnimatedLeaderboard(leaderboard.map(entry => ({
      ...entry,
      animationClass: ''
    })));
    
    // After a brief delay, trigger animations
    const timer = setTimeout(() => {
      // Compare with previous to determine animations
      setAnimatedLeaderboard(prev => {
        return leaderboard.map(entry => {
          const prevPosition = prev.findIndex(p => p.userId === entry.userId);
          const currentPosition = leaderboard.findIndex(p => p.userId === entry.userId);
          
          let animationClass = '';
          if (prevPosition !== -1 && prevPosition !== currentPosition) {
            animationClass = prevPosition < currentPosition ? 'move-down' : 'move-up';
          }
          
          return {
            ...entry,
            animationClass
          };
        });
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [leaderboard]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 py-2 font-medium text-gray-600 border-b">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-7">Player</div>
        <div className="col-span-4 text-right">Score</div>
      </div>
      
      <div className="overflow-y-auto max-h-96">
        {animatedLeaderboard.length === 0 ? (
          <div className="py-4 text-center text-gray-500">
            No scores yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {animatedLeaderboard.map((entry) => (
              <li 
                key={entry.userId} 
                className={`grid grid-cols-12 py-3 transition duration-500 ${
                  entry.userId === currentUserId 
                    ? 'bg-blue-50 font-semibold' 
                    : ''
                } ${entry.animationClass}`}
              >
                <div className="col-span-1 text-center">{entry.rank}</div>
                <div className="col-span-7 flex items-center">
                  {entry.name}
                  {entry.lastQuestionCorrect && (
                    <span className="ml-2 text-green-600 text-xs">
                      +{entry.lastQuestionScore}
                    </span>
                  )}
                </div>
                <div className="col-span-4 text-right font-bold">
                  {entry.score}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <style jsx>{`
        .move-up {
          animation: highlight-up 1s ease-in-out;
        }
        
        .move-down {
          animation: highlight-down 1s ease-in-out;
        }
        
        @keyframes highlight-up {
          0% {
            background-color: rgba(34, 197, 94, 0.2);
          }
          100% {
            background-color: transparent;
          }
        }
        
        @keyframes highlight-down {
          0% {
            background-color: rgba(239, 68, 68, 0.2);
          }
          100% {
            background-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

LiveLeaderboard.propTypes = {
  leaderboard: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      score: PropTypes.number.isRequired,
      rank: PropTypes.number.isRequired,
      lastQuestionCorrect: PropTypes.bool,
      lastQuestionScore: PropTypes.number
    })
  ).isRequired,
  currentUserId: PropTypes.string
};

export default LiveLeaderboard; 