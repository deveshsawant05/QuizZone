import React from 'react';

const AnswerSelector = ({ 
  question, 
  selectedAnswer, 
  onAnswerSelect,
  disabled = false 
}) => {
  const { questionType, options, _id } = question;

  const handleSelect = (optionId) => {
    if (!disabled) {
      onAnswerSelect(optionId);
    }
  };

  // For multiple choice questions
  const renderMultipleChoice = () => {
    return (
      <div className="space-y-3">
        {options.map((option) => (
          <div 
            key={option._id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedAnswer === option._id 
                ? 'bg-blue-100 border-blue-600' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={() => handleSelect(option._id)}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border flex-shrink-0 mr-3 flex items-center justify-center ${
                selectedAnswer === option._id ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
              }`}>
                {selectedAnswer === option._id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span>{option.text}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // For true/false questions
  const renderTrueFalse = () => {
    return (
      <div className="flex space-x-4">
        {options.map((option) => (
          <div 
            key={option._id}
            className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors text-center ${
              selectedAnswer === option._id 
                ? 'bg-blue-100 border-blue-600' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={() => handleSelect(option._id)}
          >
            <span className="font-medium">{option.text}</span>
          </div>
        ))}
      </div>
    );
  };

  // For multiple select questions
  const renderMultipleSelect = () => {
    // In a real implementation, selectedAnswer would be an array
    // For simplicity, we're using the same structure as multiple choice here
    return (
      <div className="space-y-3">
        {options.map((option) => (
          <div 
            key={option._id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedAnswer === option._id 
                ? 'bg-blue-100 border-blue-600' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={() => handleSelect(option._id)}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded border flex-shrink-0 mr-3 flex items-center justify-center ${
                selectedAnswer === option._id ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
              }`}>
                {selectedAnswer === option._id && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span>{option.text}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // For short answer questions
  const renderShortAnswer = () => {
    return (
      <div className="mt-2">
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your answer here..."
          value={selectedAnswer || ''}
          onChange={(e) => onAnswerSelect(e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  };

  // Render different UI based on question type
  switch (questionType) {
    case 'true_false':
      return renderTrueFalse();
    case 'multiple_select':
      return renderMultipleSelect();
    case 'short_answer':
      return renderShortAnswer();
    case 'multiple_choice':
    default:
      return renderMultipleChoice();
  }
};

export default AnswerSelector; 