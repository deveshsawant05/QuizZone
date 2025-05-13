import React from 'react';
import PropTypes from 'prop-types';

const ResultsSummary = ({ result }) => {
  const { totalScore, maxPossibleScore, percentageScore, timeTaken, answers } = result;
  
  // Calculate correct answers
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  
  // Format time taken
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Get score color based on percentage
  const getScoreColor = () => {
    if (percentageScore >= 80) return 'text-green-600';
    if (percentageScore >= 60) return 'text-blue-600';
    if (percentageScore >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="w-full">
      {/* Score Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Your Score</h3>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor()}`}>
            {percentageScore.toFixed(1)}%
          </div>
          <div className="text-gray-600">
            {totalScore} / {maxPossibleScore} points
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Correct Answers</div>
            <div className="text-lg font-bold">
              {correctAnswers} / {answers.length}
            </div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Time Taken</div>
            <div className="text-lg font-bold">
              {formatTime(timeTaken)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Answer Performance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Performance Breakdown</h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {answers.map((answer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">Question {index + 1}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {answer.isCorrect ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Correct
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Incorrect
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {answer.timeTaken}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

ResultsSummary.propTypes = {
  result: PropTypes.shape({
    totalScore: PropTypes.number.isRequired,
    maxPossibleScore: PropTypes.number.isRequired,
    percentageScore: PropTypes.number.isRequired,
    timeTaken: PropTypes.number.isRequired,
    answers: PropTypes.arrayOf(
      PropTypes.shape({
        questionId: PropTypes.string,
        isCorrect: PropTypes.bool.isRequired,
        timeTaken: PropTypes.number
      })
    ).isRequired
  }).isRequired
};

export default ResultsSummary; 