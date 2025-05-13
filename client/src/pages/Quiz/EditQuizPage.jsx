import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';

const EditQuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const { 
    fetchQuiz, 
    currentQuiz, 
    questions, 
    isLoading, 
    error, 
    addQuestion,
    updateQuestion,
    removeQuestion,
    publishQuiz,
    isEditing,
    isSaving,
    isPublishing,
    setEditMode
  } = useQuiz();
  
  const [currentTab, setCurrentTab] = useState('questions');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  // Form state for the question being edited
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    image: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: '', // For short_answer type
    explanation: '',
    points: 10,
    timeLimit: 30, // seconds
    order: 0
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch quiz data on component mount
  useEffect(() => {
    const loadQuiz = async () => {
      if (quizId && !currentQuiz) {
        try {
          await fetchQuiz(quizId);
        } catch (err) {
          console.error('Failed to fetch quiz:', err);
          // Prevent further API calls if we're getting rate limited
          if (err.status === 429) {
            console.warn('Rate limit reached. Please wait before trying again.');
          }
        }
      }
    };
    
    loadQuiz();
  }, [quizId, fetchQuiz, currentQuiz]);
  
  // Update form when selected question changes
  useEffect(() => {
    if (selectedQuestionId) {
      const question = questions.find(q => q._id === selectedQuestionId);
      if (question) {
        setQuestionForm({
          questionText: question.questionText || '',
          questionType: question.questionType || 'multiple_choice',
          image: question.image || '',
          options: question.options || [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          correctAnswer: question.correctAnswer || '',
          explanation: question.explanation || '',
          points: question.points || 10,
          timeLimit: question.timeLimit || currentQuiz?.settings?.timePerQuestion || 30,
          order: question.order || questions.length
        });
        setIsAddingQuestion(false);
        setEditMode(true);
      }
    }
  }, [selectedQuestionId, questions, currentQuiz, setEditMode]);
  
  // Reset form when adding a new question
  const handleAddQuestion = () => {
    setSelectedQuestionId(null);
    setQuestionForm({
      questionText: '',
      questionType: 'multiple_choice',
      image: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: '',
      explanation: '',
      points: 10,
      timeLimit: currentQuiz?.settings?.timePerQuestion || 30,
      order: questions.length
    });
    setFormErrors({});
    setIsAddingQuestion(true);
    setEditMode(true);
  };
  
  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle option changes
  const handleOptionChange = (index, field, value) => {
    setQuestionForm(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = {
        ...newOptions[index],
        [field]: value
      };
      
      // If marking an option as correct, unmark others
      if (field === 'isCorrect' && value === true) {
        newOptions.forEach((option, i) => {
          if (i !== index) {
            newOptions[i].isCorrect = false;
          }
        });
      }
      
      return {
        ...prev,
        options: newOptions
      };
    });
  };
  
  // Add a new option
  const handleAddOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };
  
  // Remove an option
  const handleRemoveOption = (index) => {
    setQuestionForm(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      return {
        ...prev,
        options: newOptions
      };
    });
  };
  
  // Validate form before submitting
  const validateForm = () => {
    const errors = {};
    
    if (!questionForm.questionText.trim()) {
      errors.questionText = 'Question text is required';
    }
    
    if (questionForm.questionType === 'multiple_choice') {
      // Check if at least one option is marked as correct
      const hasCorrectOption = questionForm.options.some(opt => opt.isCorrect);
      if (!hasCorrectOption) {
        errors.options = 'At least one option must be marked as correct';
      }
      
      // Check if all options have text
      const emptyOptions = questionForm.options.filter(opt => !opt.text.trim());
      if (emptyOptions.length > 0) {
        errors.options = 'All options must have text';
      }
    }
    
    if (questionForm.questionType === 'true_false') {
      // Check if exactly one option is marked as correct
      const correctOptions = questionForm.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        errors.options = 'Exactly one option must be marked as correct';
      }
    }
    
    if (questionForm.questionType === 'short_answer' && !questionForm.correctAnswer.trim()) {
      errors.correctAnswer = 'Correct answer is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Save the current question
  const handleSaveQuestion = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isAddingQuestion) {
        // Add new question
        await addQuestion(quizId, questionForm);
        setIsAddingQuestion(false);
      } else if (selectedQuestionId) {
        // Update existing question
        await updateQuestion(quizId, selectedQuestionId, questionForm);
      }
      
      setSelectedQuestionId(null);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setSelectedQuestionId(null);
    setIsAddingQuestion(false);
    setEditMode(false);
  };
  
  // Delete a question
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await removeQuestion(quizId, questionId);
        if (selectedQuestionId === questionId) {
          setSelectedQuestionId(null);
          setEditMode(false);
        }
      } catch (err) {
        console.error('Error deleting question:', err);
      }
    }
  };
  
  // Publish the quiz
  const handlePublishQuiz = async () => {
    if (questions.length === 0) {
      alert('You need to add at least one question before publishing.');
      return;
    }
    
    try {
      const result = await publishQuiz(quizId);
      alert(`Quiz published successfully! Share code: ${result.shareCode}`);
    } catch (err) {
      console.error('Error publishing quiz:', err);
    }
  };
  
  // If loading, show loading indicator
  if (isLoading && !currentQuiz) {
    return <Loader />;
  }
  
  // If quiz not found, show error
  if (!currentQuiz && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || 'Quiz not found. It might have been deleted or you don\'t have permission to access it.'}
        </div>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Quiz header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{currentQuiz?.title}</h1>
            <p className="text-gray-600 mt-1">{currentQuiz?.description}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Exit
            </Button>
            
            <Button
              variant="success"
              onClick={handlePublishQuiz}
              isLoading={isPublishing}
              loadingText="Publishing..."
              disabled={isPublishing || questions.length === 0}
            >
              {currentQuiz?.isPublished ? 'Update & Republish' : 'Publish Quiz'}
            </Button>
          </div>
        </div>
        
        {currentQuiz?.isPublished && (
          <div className="bg-green-50 p-3 rounded-md mb-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-green-700 text-sm">
                This quiz is published. Share code: <span className="font-bold">{currentQuiz.shareCode}</span>
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`
              pb-3 border-b-2 font-medium text-sm
              ${currentTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            onClick={() => setCurrentTab('questions')}
          >
            Questions
          </button>
          <button
            className={`
              pb-3 border-b-2 font-medium text-sm
              ${currentTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            onClick={() => setCurrentTab('settings')}
          >
            Settings
          </button>
        </nav>
      </div>
      
      {/* Questions tab content */}
      {currentTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Questions list sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="font-medium text-gray-700">Questions ({questions.length})</h2>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddQuestion}
                    disabled={isEditing}
                  >
                    Add Question
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                {questions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3">No questions added yet</p>
                    <Button
                      variant="outline"
                      onClick={handleAddQuestion}
                    >
                      Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {questions.map((question, index) => (
                      <li 
                        key={question._id} 
                        className={`
                          p-3 rounded-md cursor-pointer
                          ${selectedQuestionId === question._id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-gray-200'}
                        `}
                        onClick={() => !isEditing && setSelectedQuestionId(question._id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 truncate">
                              <h3 className="font-medium text-gray-800 truncate">
                                {question.questionText}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {question.questionType === 'multiple_choice'
                                  ? 'Multiple Choice'
                                  : question.questionType === 'true_false'
                                  ? 'True/False'
                                  : 'Short Answer'} • {question.points} pts
                              </p>
                            </div>
                          </div>
                          
                          {!isEditing && (
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(question._id);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Question editor */}
          <div className="lg:col-span-3">
            {isEditing ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {isAddingQuestion ? 'Add New Question' : 'Edit Question'}
                </h2>
                
                <div className="space-y-6">
                  <Input
                    label="Question Text"
                    name="questionText"
                    value={questionForm.questionText}
                    onChange={handleFormChange}
                    placeholder="Enter your question here"
                    error={formErrors.questionText}
                    required
                    fullWidth
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Type
                      </label>
                      <select
                        name="questionType"
                        value={questionForm.questionType}
                        onChange={handleFormChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="short_answer">Short Answer</option>
                      </select>
                    </div>
                    
                    <div>
                      <Input
                        label="Points"
                        name="points"
                        type="number"
                        value={questionForm.points}
                        onChange={handleFormChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  <Input
                    label="Image URL (optional)"
                    name="image"
                    value={questionForm.image}
                    onChange={handleFormChange}
                    placeholder="Enter an image URL"
                    error={formErrors.image}
                    fullWidth
                  />
                  
                  {/* Options for multiple choice or true/false */}
                  {(questionForm.questionType === 'multiple_choice' || questionForm.questionType === 'true_false') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options {formErrors.options && <span className="text-red-500 ml-1">{formErrors.options}</span>}
                      </label>
                      
                      <div className="space-y-3">
                        {questionForm.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`option-${index}`}
                              name="correct-option"
                              checked={option.isCorrect}
                              onChange={() => handleOptionChange(index, 'isCorrect', true)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            
                            {questionForm.questionType === 'multiple_choice' && questionForm.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {questionForm.questionType === 'multiple_choice' && (
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Add Another Option
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Correct answer for short answer questions */}
                  {questionForm.questionType === 'short_answer' && (
                    <Input
                      label="Correct Answer"
                      name="correctAnswer"
                      value={questionForm.correctAnswer}
                      onChange={handleFormChange}
                      placeholder="Enter the correct answer"
                      error={formErrors.correctAnswer}
                      required
                      fullWidth
                    />
                  )}
                  
                  <Input
                    label="Explanation (optional)"
                    name="explanation"
                    value={questionForm.explanation}
                    onChange={handleFormChange}
                    placeholder="Explain why this answer is correct"
                    error={formErrors.explanation}
                    fullWidth
                  />
                  
                  <Input
                    label="Time Limit (seconds)"
                    name="timeLimit"
                    type="number"
                    value={questionForm.timeLimit}
                    onChange={handleFormChange}
                    min="5"
                    error={formErrors.timeLimit}
                    required
                    fullWidth
                  />
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveQuestion}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save Question
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {questions.length === 0
                      ? 'No questions yet'
                      : 'Select a question to edit or add a new one'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {questions.length === 0
                      ? 'Get started by adding your first question'
                      : 'Click on a question from the list to edit its details'}
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleAddQuestion}
                  >
                    Add Question
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Settings tab content */}
      {currentTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quiz Settings</h2>
          
          <p className="text-gray-500 italic">Quiz settings editor will be added in a future update.</p>
        </div>
      )}
    </div>
  );
};

export default EditQuizPage; 