import React, { useState } from 'react';
import PropTypes from 'prop-types';

const QuestionBreakdown = ({ questions }) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  
  // Toggle question expansion
  const toggleQuestion = (questionId) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    } else {
      setExpandedQuestionId(questionId);
    }
  };
  
  return (
    <div className="w-full">
      {questions.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No questions available
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div 
              key={question._id || index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Question header - always visible */}
              <div 
                className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleQuestion(question._id || index)}
              >
                <div>
                  <h3 className="font-medium text-base">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                    {question.questionText}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <div className="text-right mr-3">
                    <div className="text-sm text-gray-600">Correct</div>
                    <div className="font-bold">{question.stats?.correctPercentage || 0}%</div>
                  </div>
                  
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${
                      expandedQuestionId === (question._id || index) ? 'rotate-180' : ''
                    }`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
              
              {/* Question details - only visible when expanded */}
              {expandedQuestionId === (question._id || index) && (
                <div className="p-4 border-t border-gray-200">
                  {/* Question text */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Question</h4>
                    <p>{question.questionText}</p>
                    
                    {question.image && (
                      <div className="mt-2">
                        <img 
                          src={question.image} 
                          alt="Question" 
                          className="max-h-40 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Options */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Answer Options</h4>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={option._id || optIndex}
                          className={`p-3 rounded-lg border ${
                            option.isCorrect 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              {option.text}
                              {option.isCorrect && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">
                                  Correct
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              {option.stats?.selectedPercentage || 0}%
                            </div>
                          </div>
                          
                          {/* Progress bar showing selection percentage */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                              className={`h-1.5 rounded-full ${option.isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${option.stats?.selectedPercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Average Time</div>
                      <div className="font-bold">{question.stats?.averageTime || 0}s</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Correct</div>
                      <div className="font-bold">{question.stats?.correctCount || 0}</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Incorrect</div>
                      <div className="font-bold">{question.stats?.incorrectCount || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

QuestionBreakdown.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      questionText: PropTypes.string.isRequired,
      image: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string,
          text: PropTypes.string.isRequired,
          isCorrect: PropTypes.bool,
          stats: PropTypes.shape({
            selectedCount: PropTypes.number,
            selectedPercentage: PropTypes.number
          })
        })
      ).isRequired,
      stats: PropTypes.shape({
        correctCount: PropTypes.number,
        incorrectCount: PropTypes.number,
        correctPercentage: PropTypes.number,
        averageTime: PropTypes.number
      })
    })
  ).isRequired
};

export default QuestionBreakdown; 