import React from 'react';
import PropTypes from 'prop-types';

const ParticipantList = ({ participants, showControls = false, onRemove }) => {
  return (
    <div className="w-full">
      {participants.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No participants yet
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {participants.map((participant) => (
            <li 
              key={participant.userId} 
              className="py-3 px-2 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${participant.connected ? 'bg-green-500' : 'bg-gray-300'} mr-3`}></div>
                <span className="font-medium">{participant.name}</span>
                {participant.ready && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                    Ready
                  </span>
                )}
              </div>
              
              {showControls && (
                <div className="flex">
                  <button
                    onClick={() => onRemove && onRemove(participant.userId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    title="Remove participant"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

ParticipantList.propTypes = {
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      ready: PropTypes.bool,
      connected: PropTypes.bool
    })
  ).isRequired,
  showControls: PropTypes.bool,
  onRemove: PropTypes.func
};

export default ParticipantList; 