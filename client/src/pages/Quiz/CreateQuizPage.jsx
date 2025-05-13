import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const { createQuiz, error, isSaving } = useQuiz();
  
  const [step, setStep] = useState(1);
  const [quizType, setQuizType] = useState(null);
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    coverImage: '',
    type: 'static',
    settings: {
      timePerQuestion: 30,
      randomizeQuestions: false,
      showCorrectAnswers: true,
      showExplanations: true,
      scoringMode: 'standard',
      passingScore: 70,
    },
    tags: [],
  });
  
  const [errors, setErrors] = useState({});
  
  // Handle quiz type selection
  const handleQuizTypeSelect = (type) => {
    setQuizType(type);
    setQuizData(prev => ({ ...prev, type }));
    setStep(2);
  };
  
  // Handle basic quiz details input
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (like settings.timePerQuestion)
      const [parent, child] = name.split('.');
      setQuizData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setQuizData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle tags input (comma-separated)
  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    
    setQuizData(prev => ({ ...prev, tags: tagsArray }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (like settings.randomizeQuestions)
      const [parent, child] = name.split('.');
      setQuizData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: checked
        }
      }));
    } else {
      setQuizData(prev => ({ ...prev, [name]: checked }));
    }
  };
  
  // Validate quiz details
  const validateDetails = () => {
    const newErrors = {};
    
    // Required fields
    if (!quizData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!quizData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Validate settings
    if (parseInt(quizData.settings.timePerQuestion) < 5) {
      newErrors['settings.timePerQuestion'] = 'Time must be at least 5 seconds';
    }
    
    if (parseInt(quizData.settings.passingScore) < 0 || parseInt(quizData.settings.passingScore) > 100) {
      newErrors['settings.passingScore'] = 'Passing score must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle details form submission
  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    
    if (validateDetails()) {
      setStep(3);
    }
  };
  
  // Handle create quiz
  const handleCreateQuiz = async () => {
    try {
      const newQuiz = await createQuiz(quizData);
      navigate(`/quiz/${newQuiz._id}/edit`);
    } catch (err) {
      console.error('Failed to create quiz:', err);
    }
  };
  
  // Render quiz type selection step
  const renderQuizTypeSelection = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Select Quiz Type</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Static Quiz"
            subtitle="Self-paced quiz that participants can take anytime"
            description="Create a quiz that can be shared via link and taken at the user's convenience. Great for assessments, homework, and practice tests."
            image="https://source.unsplash.com/random/400x300/?quiz"
            onClick={() => handleQuizTypeSelect('static')}
            className={quizType === 'static' ? 'ring-2 ring-blue-500' : ''}
            footer={
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">No time restrictions</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuizTypeSelect('static');
                  }}
                >
                  Select
                </Button>
              </div>
            }
          />
          
          <Card
            title="Live Quiz"
            subtitle="Real-time interactive quiz experience"
            description="Create a quiz that is played live with all participants at the same time. Perfect for classroom activities, team building, and interactive events."
            image="https://source.unsplash.com/random/400x300/?competition"
            onClick={() => handleQuizTypeSelect('live')}
            className={quizType === 'live' ? 'ring-2 ring-blue-500' : ''}
            footer={
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Synchronized experience</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuizTypeSelect('live');
                  }}
                >
                  Select
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  };
  
  // Render quiz details form step
  const renderQuizDetailsForm = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Quiz Details</h1>
        
        <form onSubmit={handleDetailsSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <Input
              label="Quiz Title"
              name="title"
              value={quizData.title}
              onChange={handleChange}
              placeholder="Enter a title for your quiz"
              error={errors.title}
              required
              fullWidth
            />
            
            <Input
              label="Description"
              name="description"
              value={quizData.description}
              onChange={handleChange}
              placeholder="Describe what your quiz is about"
              error={errors.description}
              required
              fullWidth
            />
            
            <Input
              label="Cover Image URL (optional)"
              name="coverImage"
              value={quizData.coverImage}
              onChange={handleChange}
              placeholder="Enter a URL for the cover image"
              error={errors.coverImage}
              fullWidth
              helperText="Add an image to make your quiz stand out"
            />
            
            <Input
              label="Tags (comma-separated)"
              name="tags"
              value={quizData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="e.g., science, biology, beginner"
              error={errors.tags}
              fullWidth
              helperText="Add tags to help others find your quiz"
            />
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Quiz Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Time per Question (seconds)"
                  name="settings.timePerQuestion"
                  type="number"
                  value={quizData.settings.timePerQuestion}
                  onChange={handleChange}
                  error={errors['settings.timePerQuestion']}
                  min="5"
                  required
                />
                
                <Input
                  label="Passing Score (%)"
                  name="settings.passingScore"
                  type="number"
                  value={quizData.settings.passingScore}
                  onChange={handleChange}
                  error={errors['settings.passingScore']}
                  min="0"
                  max="100"
                  required
                />
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="randomizeQuestions"
                    name="settings.randomizeQuestions"
                    checked={quizData.settings.randomizeQuestions}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="randomizeQuestions" className="ml-2 block text-sm text-gray-700">
                    Randomize question order
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showCorrectAnswers"
                    name="settings.showCorrectAnswers"
                    checked={quizData.settings.showCorrectAnswers}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showCorrectAnswers" className="ml-2 block text-sm text-gray-700">
                    Show correct answers after completion
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showExplanations"
                    name="settings.showExplanations"
                    checked={quizData.settings.showExplanations}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showExplanations" className="ml-2 block text-sm text-gray-700">
                    Show explanations for answers
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            
            <Button
              type="submit"
              variant="primary"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    );
  };
  
  // Render confirmation step
  const renderConfirmation = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Review & Create</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{quizData.title}</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {quizData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <p className="text-gray-700 mb-6">{quizData.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Quiz Type</h3>
                <p className="text-gray-800 capitalize">{quizData.type}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Time per Question</h3>
                <p className="text-gray-800">{quizData.settings.timePerQuestion} seconds</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Passing Score</h3>
                <p className="text-gray-800">{quizData.settings.passingScore}%</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Settings</h3>
                <ul className="text-gray-800 text-sm">
                  {quizData.settings.randomizeQuestions && <li>• Randomize question order</li>}
                  {quizData.settings.showCorrectAnswers && <li>• Show correct answers</li>}
                  {quizData.settings.showExplanations && <li>• Show explanations</li>}
                </ul>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                After creating your quiz, you'll be able to add questions.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Edit Details
                </Button>
                
                <Button
                  variant="primary"
                  onClick={handleCreateQuiz}
                  isLoading={isSaving}
                  loadingText="Creating..."
                >
                  Create Quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Determine which step to render
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderQuizTypeSelection();
      case 2:
        return renderQuizDetailsForm();
      case 3:
        return renderConfirmation();
      default:
        return renderQuizTypeSelection();
    }
  };
  
  // Render step progress indicator
  const renderStepIndicator = () => {
    return (
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`h-1 w-12 sm:w-24 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
          
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`h-1 w-12 sm:w-24 ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
          
          <div className="flex items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <div className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Quiz Type</div>
          <div className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Quiz Details</div>
          <div className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Review & Create</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {renderStepIndicator()}
      {renderStep()}
    </div>
  );
};

export default CreateQuizPage; 