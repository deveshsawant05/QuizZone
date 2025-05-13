import React from 'react';
import PropTypes from 'prop-types';

const QuestionPreview = ({ question, questionNumber }) => {
  if (!question) return null;
  
  // Find the correct answer
  const correctAnswer = question.options.find(opt => opt.isCorrect);
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-500">Question {questionNumber}</span>
        <h3 className="text-xl font-bold mt-1">{question.questionText}</h3>
      </div>
      
      {question.image && (
        <div className="mb-4">
          <img 
            src={question.image} 
            alt="Question" 
            className="max-h-60 object-contain rounded-lg"
          />
        </div>
      )}
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Answer Options:</h4>
        <ul className="space-y-2">
          {question.options.map((option) => (
            <li 
              key={option._id}
              className={`p-3 rounded-lg border ${
                option.isCorrect 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-grow">
                  {option.text}
                </div>
                {option.isCorrect && (
                  <div className="ml-2 text-green-600 font-semibold">
                    ✓ Correct
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {question.explanation && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium mb-1">Explanation:</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

QuestionPreview.propTypes = {
  question: PropTypes.shape({
    questionText: PropTypes.string.isRequired,
    image: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        isCorrect: PropTypes.bool
      })
    ).isRequired,
    explanation: PropTypes.string
  }),
  questionNumber: PropTypes.number.isRequired
};

export default QuestionPreview; 