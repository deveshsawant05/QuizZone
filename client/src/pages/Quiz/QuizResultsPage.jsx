import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Components
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/ui/Button';

const QuizResultsPage = () => {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch quiz results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/quizzes/${quizId}/results?attemptId=${attemptId}`);
        
        if (data.success) {
          setResult(data.data.result);
        } else {
          setError('Failed to load quiz results');
        }
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError('Could not retrieve your quiz results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [quizId, attemptId]);
  
  // Format time function
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    // If it's already formatted as "4m 30s"
    if (typeof timeString === 'string' && timeString.includes('m')) {
      return timeString;
    }
    
    // If it's a number of seconds
    const minutes = Math.floor(timeString / 60);
    const seconds = timeString % 60;
    return `${minutes}m ${seconds}s`;
  };
  
  // Show loading spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  // Show error message
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            className="mt-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (!result) {
    return null;
  }
  
  const { 
    totalScore, 
    maxPossibleScore, 
    percentageScore, 
    passed, 
    startedAt, 
    completedAt, 
    timeTaken, 
    answers,
    quiz 
  } = result;
  
  // Determine result color class
  const getScoreColorClass = () => {
    if (percentageScore >= 80) return 'text-green-600';
    if (percentageScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-4xl mx-auto">
        {/* Header section */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">{quiz?.title} - Results</h1>
          <p>{quiz?.description}</p>
        </div>
        
        {/* Score summary */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-semibold mb-2">Your Score</h2>
              <div className="flex items-baseline">
                <span className={`text-4xl font-bold ${getScoreColorClass()}`}>
                  {percentageScore}%
                </span>
                <span className="ml-2 text-gray-600">
                  ({totalScore}/{maxPossibleScore} points)
                </span>
              </div>
              <div className="mt-1">
                <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-gray-500 text-sm">Time Taken</p>
                  <p className="font-semibold">{formatTime(timeTaken)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Questions</p>
                  <p className="font-semibold">{answers?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Started</p>
                  <p className="font-semibold">{new Date(startedAt).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Completed</p>
                  <p className="font-semibold">{new Date(completedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed answers */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Question Review</h2>
          
          <div className="space-y-6">
            {answers?.map((answer, index) => (
              <div 
                key={answer.questionId} 
                className={`p-4 border rounded-lg ${
                  answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start mb-3">
                  <div className={`rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 ${
                    answer.isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {answer.isCorrect ? '✓' : '✗'}
                  </div>
                  <h3 className="text-lg font-medium">
                    Question {index + 1}: {answer.questionText}
                  </h3>
                </div>
                
                <div className="ml-8">
                  <div className="mb-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Your Answer:</span> {answer.selectedOption?.text}
                    </p>
                    
                    {!answer.isCorrect && (
                      <p className="text-green-700 mt-1">
                        <span className="font-medium">Correct Answer:</span> {answer.correctOption?.text}
                      </p>
                    )}
                  </div>
                  
                  {answer.explanation && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Explanation:</p>
                      <p className="text-sm text-gray-600">{answer.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="p-6 bg-gray-50 flex flex-wrap gap-4 justify-center">
          <Button 
            type="secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          
          {quiz?.shareCode ? (
            <Link to={`/quiz/${quiz.shareCode}`}>
              <Button>
                Try Again
              </Button>
            </Link>
          ) : null}
          
          {/* Social share buttons could be added here */}
        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage; 