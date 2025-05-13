import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Components
import QuestionDisplay from '../../components/Quiz/Play/QuestionDisplay';
import AnswerSelector from '../../components/Quiz/Play/AnswerSelector';
import Timer from '../../components/Timer';
import LoadingSpinner from '../../components/LoadingSpinner';
import LiveLeaderboard from '../../components/LiveQuiz/LiveLeaderboard';
import WaitingIndicator from '../../components/LiveQuiz/WaitingIndicator';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

const LiveQuizPlayerPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionResults, setQuestionResults] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    const setupSocket = () => {
      const newSocket = io('/live-quiz', {
        auth: {
          token: localStorage.getItem('accessToken')
        }
      });
      
      // Socket connection events
      newSocket.on('connect', () => {
        console.log('Player socket connected');
        setConnected(true);
        
        // Re-join room if reconnecting
        newSocket.emit('join:room', { roomId });
      });
      
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Connection error');
        setError(error.message || 'Failed to connect to the quiz');
      });
      
      newSocket.on('quiz:start', (data) => {
        setWaiting(false);
        toast.success('Quiz has started!');
      });
      
      newSocket.on('quiz:question', (data) => {
        setCurrentQuestion(data);
        setSelectedAnswer(null);
        setHasAnswered(false);
        setShowLeaderboard(false);
        setQuestionResults(null);
        setTimeRemaining(data.timeLimit);
      });
      
      newSocket.on('quiz:timer', (data) => {
        setTimeRemaining(data.remainingTime);
      });
      
      newSocket.on('answer:received', (data) => {
        if (data.received) {
          toast.success('Answer submitted!');
        }
      });
      
      newSocket.on('quiz:question-end', (data) => {
        setQuestionResults(data);
        
        // If not answered yet, mark as incorrect
        if (!hasAnswered) {
          toast.error('Time is up!');
        }
      });
      
      newSocket.on('quiz:leaderboard', (data) => {
        setLeaderboard(data.leaderboard);
        setShowLeaderboard(true);
      });
      
      newSocket.on('quiz:paused', () => {
        toast.info('Quiz has been paused by the host');
      });
      
      newSocket.on('quiz:resumed', () => {
        toast.success('Quiz has been resumed');
      });
      
      newSocket.on('quiz:end', (finalResults) => {
        toast.success('Quiz has ended!');
        // Navigate to results page
        navigate(`/live-quiz/${roomId}/results`);
      });
      
      newSocket.on('you:removed', (data) => {
        toast.error('You have been removed from the quiz by the host');
        navigate('/');
      });
      
      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
        toast.error('Disconnected from server, attempting to reconnect...');
      });
      
      setSocket(newSocket);
      
      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    };
    
    setupSocket();
  }, [roomId, navigate]);
  
  // Handle answer selection
  const handleAnswerSelect = (questionId, optionId) => {
    setSelectedAnswer(optionId);
  };
  
  // Submit answer
  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion || hasAnswered) return;
    
    // Calculate time taken
    const timeTaken = currentQuestion.timeLimit - (timeRemaining || 0);
    
    // Send answer to server
    socket.emit('submit:answer', {
      roomId,
      questionId: currentQuestion.questionId,
      answerId: selectedAnswer,
      timeTaken: Math.max(1, timeTaken) // Ensure positive time taken
    });
    
    setHasAnswered(true);
  };
  
  // Auto-submit when answer is selected
  useEffect(() => {
    if (selectedAnswer && !hasAnswered && currentQuestion) {
      handleSubmitAnswer();
    }
  }, [selectedAnswer]);
  
  // Handle timer expiration
  const handleTimeExpire = () => {
    if (!hasAnswered && currentQuestion) {
      toast.error('Time is up!');
    }
  };
  
  // Loading state
  if (!connected) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Connecting to quiz room...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-6">{error}</p>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </Card>
      </div>
    );
  }
  
  // Waiting for quiz to start
  if (waiting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <h1 className="text-2xl font-bold mb-6 text-center">Waiting for Quiz to Start</h1>
          <WaitingIndicator message="The host will start the quiz soon..." />
        </Card>
      </div>
    );
  }
  
  // Show leaderboard between questions
  if (showLeaderboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <h1 className="text-2xl font-bold mb-6 text-center">Leaderboard</h1>
          <LiveLeaderboard leaderboard={leaderboard} currentUserId={user?.id} />
          <p className="text-center mt-6 text-gray-600">
            Next question coming up soon...
          </p>
        </Card>
      </div>
    );
  }
  
  // Show question results if available
  if (questionResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <h1 className="text-2xl font-bold mb-6 text-center">Question Results</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Correct Answer:</h2>
            <div className="bg-green-100 border border-green-200 rounded-lg p-4">
              {currentQuestion.options.find(opt => opt._id === questionResults.correctAnswerId)?.text}
            </div>
          </div>
          
          {questionResults.explanation && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Explanation:</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                {questionResults.explanation}
              </div>
            </div>
          )}
          
          <div className="text-center mt-6 text-gray-600">
            Waiting for next question...
          </div>
        </Card>
      </div>
    );
  }
  
  // Show current question
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        {/* Timer */}
        {timeRemaining !== null && (
          <div className="mb-6">
            <Timer 
              duration={timeRemaining} 
              onTimeExpired={handleTimeExpire} 
              mode="countdown"
              warningThreshold={10}
            />
          </div>
        )}
        
        {/* Question */}
        {currentQuestion && (
          <>
            <QuestionDisplay 
              question={currentQuestion} 
              questionNumber={currentQuestion.questionNumber}
            />
            
            <div className="mt-6">
              <AnswerSelector 
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={handleAnswerSelect}
                disabled={hasAnswered}
              />
            </div>
            
            {hasAnswered && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-semibold">
                  Your answer has been submitted!
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Waiting for other participants...
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default LiveQuizPlayerPage; 