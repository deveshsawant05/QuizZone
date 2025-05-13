import React from 'react';
import PropTypes from 'prop-types';

const QuizProgressDisplay = ({ currentQuestion, totalQuestions }) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((currentQuestion / totalQuestions) * 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="text-sm font-medium text-gray-600">
          {progressPercentage}% Complete
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

QuizProgressDisplay.propTypes = {
  currentQuestion: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired
};

export default QuizProgressDisplay; 