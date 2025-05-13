import React from 'react';

const ProgressIndicator = ({ currentQuestion, totalQuestions }) => {
  // Calculate percentage complete
  const percentComplete = Math.floor((currentQuestion / totalQuestions) * 100);

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between mb-1 text-sm">
        <span>Question {currentQuestion} of {totalQuestions}</span>
        <span>{percentComplete}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${percentComplete}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 