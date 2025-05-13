import React from 'react';
import PropTypes from 'prop-types';

const FinalLeaderboard = ({ participants, currentUserId }) => {
  // Sort participants by rank
  const sortedParticipants = [...participants].sort((a, b) => a.rank - b.rank);
  
  // Get top 3 for special styling
  const topThree = sortedParticipants.slice(0, 3);
  const rest = sortedParticipants.slice(3);
  
  return (
    <div className="w-full">
      {/* Top 3 with medals */}
      <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-8">
        {topThree.map((participant, index) => {
          const isCurrentUser = participant.userId === currentUserId;
          const medals = ['🥇', '🥈', '🥉'];
          const heights = ['h-32', 'h-24', 'h-20'];
          
          return (
            <div 
              key={participant.userId}
              className={`flex flex-col items-center ${index === 1 ? 'order-first md:order-none' : ''}`}
            >
              <div 
                className={`${heights[index]} w-24 flex items-center justify-center rounded-t-lg ${
                  isCurrentUser ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'
                } border text-2xl font-bold`}
              >
                {participant.score}
              </div>
              <div 
                className={`w-24 p-2 rounded-b-lg text-center ${
                  isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'
                }`}
              >
                <div className="text-xl mb-1">{medals[index]}</div>
                <div className="font-semibold text-sm truncate" title={participant.name}>
                  {participant.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Rest of the leaderboard */}
      <div className="bg-white rounded-lg overflow-hidden border">
        <div className="grid grid-cols-12 py-2 font-medium text-gray-600 border-b bg-gray-50">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-7 px-4">Player</div>
          <div className="col-span-2 text-center">Correct</div>
          <div className="col-span-2 text-right px-4">Score</div>
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {rest.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No other participants
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {rest.map((participant) => (
                <li 
                  key={participant.userId} 
                  className={`grid grid-cols-12 py-3 ${
                    participant.userId === currentUserId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="col-span-1 text-center font-medium">{participant.rank}</div>
                  <div className="col-span-7 px-4">
                    <div className="font-medium">{participant.name}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    {participant.answersCorrect}/{participant.totalQuestions}
                  </div>
                  <div className="col-span-2 text-right px-4 font-bold">
                    {participant.score}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

FinalLeaderboard.propTypes = {
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      score: PropTypes.number.isRequired,
      rank: PropTypes.number.isRequired,
      answersCorrect: PropTypes.number.isRequired,
      totalQuestions: PropTypes.number.isRequired
    })
  ).isRequired,
  currentUserId: PropTypes.string
};

export default FinalLeaderboard; 