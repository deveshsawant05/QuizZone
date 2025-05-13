import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Components
import QuestionDisplay from '../../components/Quiz/Play/QuestionDisplay';
import AnswerSelector from '../../components/Quiz/Play/AnswerSelector';
import ProgressIndicator from '../../components/Quiz/Play/ProgressIndicator';
import Timer from '../../components/Timer';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/ui/Button';

// Services
import { getSharedQuiz, startQuizAttempt, submitQuizAnswers } from '../../services/quizService';

const QuizPlayerPage = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  
  // State
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex] || null;
  
  // Fetch quiz and questions
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        
        // Use the quiz service instead of direct axios call
        const data = await getSharedQuiz(shareCode);
        
        if (data) {
          const { quiz, questions: fetchedQuestions } = data;
          
          if (!quiz || !fetchedQuestions || fetchedQuestions.length === 0) {
            throw new Error('Quiz or questions not found');
          }
          
          setQuiz(quiz);
          
          // If questions are randomized, shuffle them
          let questionsToUse = [...fetchedQuestions];
          if (quiz.settings?.randomizeQuestions) {
            // Simple shuffle algorithm
            for (let i = questionsToUse.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [questionsToUse[i], questionsToUse[j]] = [questionsToUse[j], questionsToUse[i]];
            }
          }
          
          setQuestions(questionsToUse);
        } else {
          throw new Error('Failed to load quiz data');
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('This quiz does not exist or you do not have permission to access it');
        toast.error('Could not load quiz. Please check the share code and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (shareCode) {
      fetchQuiz();
    } else {
      setError('Invalid share code');
      setLoading(false);
    }
  }, [shareCode]);
  
  // Start quiz attempt
  const startQuiz = async () => {
    try {
      if (!quiz) {
        toast.error('Quiz not found');
        return;
      }
      
      const attempt = await startQuizAttempt(quiz._id);
      
      if (attempt) {
        setAttemptId(attempt._id || attempt.attemptId);
        setQuizStarted(true);
        
        // Set initial timer for first question
        if (currentQuestion) {
          const questionTime = currentQuestion.timeLimit || quiz.settings?.timePerQuestion || 30;
          setTimeRemaining(questionTime);
        }
        
        toast.success('Quiz started!');
      } else {
        toast.error('Failed to start quiz');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      toast.error('Error starting quiz. Please try again.');
    }
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };
  
  // Handle navigation to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      
      // Set timer for next question
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion) {
        const questionTime = nextQuestion.timeLimit || quiz.settings?.timePerQuestion || 30;
        setTimeRemaining(questionTime);
      }
    } else {
      handleSubmitQuiz();
    }
  };
  
  // Handle navigation to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      
      // Reset timer for previous question
      const prevQuestion = questions[currentQuestionIndex - 1];
      if (prevQuestion) {
        const questionTime = prevQuestion.timeLimit || quiz.settings?.timePerQuestion || 30;
        setTimeRemaining(questionTime);
      }
    }
  };
  
  // Handle timer expiration
  const handleTimeExpire = () => {
    // Automatically move to next question when time expires
    if (currentQuestionIndex < questions.length - 1) {
      handleNextQuestion();
    } else {
      handleSubmitQuiz();
    }
  };
  
  // Submit quiz
  const handleSubmitQuiz = async () => {
    try {
      if (!quiz || !attemptId) {
        toast.error('Quiz data is missing');
        return;
      }
      
      // Format answers for submission
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        selectedOptionId: answers[questionId],
        timeTaken: questions.find(q => q._id === questionId)?.timeLimit || quiz.settings?.timePerQuestion || 30
      }));
      
      // Show loading notification
      const loadingToast = toast.loading('Submitting quiz...');
      
      try {
        const result = await submitQuizAnswers(quiz._id, {
          attemptId,
          answers: formattedAnswers
        });
        
        toast.dismiss(loadingToast);
        
        if (result) {
          // Navigate to results page
          toast.success('Quiz submitted successfully!');
          navigate(`/quiz/${quiz._id}/results/${attemptId}`);
        } else {
          toast.error('Failed to submit quiz');
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        console.error('Error submitting quiz:', err);
        
        // More detailed error message
        const errorMessage = err.response?.data?.error || 'Error submitting quiz. Please try again.';
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Error preparing quiz submission:', err);
      toast.error('Error preparing quiz data. Please try again.');
    }
  };
  
  // Show loading spinner while fetching quiz
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
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Show quiz intro if quiz is loaded but not started
  if (quiz && !quizStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
          <p className="mb-4">{quiz.description}</p>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Quiz Details:</h2>
            <ul className="list-disc pl-6">
              <li>Number of questions: {questions.length}</li>
              <li>Time per question: {quiz.settings?.timePerQuestion || 30} seconds</li>
              <li>Passing score: {quiz.settings?.passingScore || 70}%</li>
            </ul>
          </div>
          
          <Button
            onClick={startQuiz}
            className="w-full py-3 text-lg"
          >
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Header with progress and timer */}
        <div className="flex justify-between items-center mb-6">
          <ProgressIndicator 
            currentQuestion={currentQuestionIndex + 1} 
            totalQuestions={questions.length} 
          />
          
          {quiz?.settings?.timePerQuestion && (
            <Timer 
              duration={timeRemaining} 
              onTimeExpired={handleTimeExpire} 
              mode="countdown"
            />
          )}
        </div>
        
        {/* Question content */}
        {currentQuestion && (
          <>
            <QuestionDisplay 
              question={currentQuestion} 
              questionNumber={currentQuestionIndex + 1}
            />
            
            <AnswerSelector 
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion._id] || null}
              onAnswerSelect={(selectedOption) => 
                handleAnswerSelect(currentQuestion._id, selectedOption)
              }
            />
          </>
        )}
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="secondary"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={handleNextQuestion}
              disabled={!answers[currentQuestion?._id]}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!answers[currentQuestion?._id]}
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayerPage; 