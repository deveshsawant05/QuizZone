import React from 'react';

const QuestionDisplay = ({ question, questionNumber }) => {
  const { questionText, image } = question;

  return (
    <div className="mb-6">
      <div className="flex items-start mb-2">
        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
          {questionNumber}
        </div>
        <h2 className="text-xl font-semibold">{questionText}</h2>
      </div>
      
      {image && (
        <div className="mt-4 mb-6">
          <img 
            src={image} 
            alt="Question" 
            className="max-w-full rounded-lg max-h-72 object-contain mx-auto"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay; 