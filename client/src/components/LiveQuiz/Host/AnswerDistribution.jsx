import React from 'react';
import PropTypes from 'prop-types';

const AnswerDistribution = ({ statistics, question }) => {
  if (!statistics || !question) return null;
  
  // Find the correct answer
  const correctOptionId = question.options.find(opt => opt.isCorrect)?._id;
  
  return (
    <div className="w-full">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xl font-bold text-green-700">
            {statistics.correctAnswers || 0}
          </div>
          <div className="text-sm text-green-600">Correct Answers</div>
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-xl font-bold text-red-700">
            {statistics.incorrectAnswers || 0}
          </div>
          <div className="text-sm text-red-600">Incorrect Answers</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="mb-2 flex justify-between items-center">
          <h4 className="font-medium">Answer Distribution</h4>
          <div className="text-sm text-gray-600">
            Avg. Response Time: {parseFloat(statistics.averageResponseTime || 0).toFixed(1)}s
          </div>
        </div>
        
        {statistics.optionDistribution && statistics.optionDistribution.map((option) => {
          const matchingOption = question.options.find(opt => opt._id === option.optionId);
          const isCorrect = option.optionId === correctOptionId;
          
          return (
            <div key={option.optionId} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-sm font-medium truncate max-w-xs">
                    {matchingOption?.text || 'Unknown option'}
                  </span>
                  {isCorrect && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">
                      Correct
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {option.count || 0} ({Math.round(option.percentage || 0)}%)
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${option.percentage || 0}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* No answers warning */}
      {(!statistics.optionDistribution || statistics.optionDistribution.every(opt => opt.count === 0)) && (
        <div className="text-center text-yellow-600 py-2">
          No answers submitted yet
        </div>
      )}
    </div>
  );
};

AnswerDistribution.propTypes = {
  statistics: PropTypes.shape({
    correctAnswers: PropTypes.number,
    incorrectAnswers: PropTypes.number,
    averageResponseTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    optionDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        optionId: PropTypes.string.isRequired,
        count: PropTypes.number,
        percentage: PropTypes.number
      })
    )
  }),
  question: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        isCorrect: PropTypes.bool
      })
    ).isRequired
  })
};

export default AnswerDistribution; 