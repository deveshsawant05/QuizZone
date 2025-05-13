import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ParticipantList from '../../components/LiveQuiz/ParticipantList';
import QuestionPreview from '../../components/LiveQuiz/Host/QuestionPreview';
import TimerControl from '../../components/LiveQuiz/Host/TimerControl';
import QuizProgressDisplay from '../../components/LiveQuiz/Host/QuizProgressDisplay';
import AnswerDistribution from '../../components/LiveQuiz/Host/AnswerDistribution';
import { useAuth } from '../../context/AuthContext';

const LiveQuizHostPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [quiz, setQuiz] = useState(null);
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [quizState, setQuizState] = useState('waiting'); // waiting, active, paused, completed
  const [showingResults, setShowingResults] = useState(false);
  const [answerStats, setAnswerStats] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex] || null;
  
  // Load room data
  useEffect(() => {
    const loadRoom = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/live-quizzes/${roomId}`);
        
        if (data.success) {
          setRoom(data.data);
          setQuizState(data.data.status);
          
          // Fetch quiz details including questions
          const quizResponse = await axios.get(`/api/quizzes/${data.data.quiz._id}`);
          if (quizResponse.data.success) {
            setQuiz(quizResponse.data.data.quiz);
            setQuestions(quizResponse.data.data.quiz.questions || []);
          }
          
          // Setup socket connection
          setupSocketConnection();
        } else {
          setError('Failed to load room data');
          toast.error('Failed to load room data');
        }
      } catch (err) {
        console.error('Error loading room:', err);
        setError('Room not found or you do not have permission to host');
        toast.error('Error loading room');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoom();
  }, [roomId]);
  
  // Setup WebSocket connection
  const setupSocketConnection = () => {
    const newSocket = io('/live-quiz', {
      auth: {
        token: localStorage.getItem('accessToken')
      }
    });
    
    // Socket connection events
    newSocket.on('connect', () => {
      console.log('Host socket connected');
      
      // Join the room as host
      newSocket.emit('join:room', {
        roomId,
        isHost: true
      });
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Error connecting to game');
    });
    
    newSocket.on('room:joined', (data) => {
      setParticipants(data.participants || []);
    });
    
    newSocket.on('user:joined', (data) => {
      setParticipants(prev => {
        if (!prev.some(p => p.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
      
      toast.success(`${data.name} joined the room`);
    });
    
    newSocket.on('user:left', (data) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      toast(`${data.name} left the room`, { icon: '👋' });
    });
    
    newSocket.on('participant:status', (data) => {
      setParticipants(prev => 
        prev.map(p => 
          p.userId === data.userId ? { ...p, ready: data.ready } : p
        )
      );
    });
    
    newSocket.on('quiz:question-end', (data) => {
      setAnswerStats(data.statistics);
      setShowingResults(true);
    });
    
    newSocket.on('quiz:paused', () => {
      setQuizState('paused');
      toast.info('Quiz paused');
    });
    
    newSocket.on('quiz:resumed', () => {
      setQuizState('active');
      toast.success('Quiz resumed');
    });
    
    newSocket.on('quiz:end', (finalResults) => {
      setQuizState('completed');
      // Navigate to results page
      navigate(`/live-quiz/${roomId}/results`);
    });
    
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  };
  
  // Start quiz
  const startQuiz = () => {
    if (socket && roomId) {
      socket.emit('host:start-quiz', { roomId });
      setQuizState('active');
      setCurrentQuestionIndex(0);
    }
  };
  
  // Next question
  const nextQuestion = () => {
    if (socket && roomId) {
      setShowingResults(false);
      
      if (currentQuestionIndex < questions.length - 1) {
        socket.emit('host:next-question', { roomId });
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // End quiz if this was the last question
        endQuiz();
      }
    }
  };
  
  // Pause quiz
  const pauseQuiz = () => {
    if (socket && roomId && quizState === 'active') {
      socket.emit('host:pause-quiz', { roomId });
      setQuizState('paused');
    }
  };
  
  // Resume quiz
  const resumeQuiz = () => {
    if (socket && roomId && quizState === 'paused') {
      socket.emit('host:resume-quiz', { roomId });
      setQuizState('active');
    }
  };
  
  // End quiz
  const endQuiz = () => {
    if (socket && roomId) {
      socket.emit('host:end-quiz', { roomId });
      setQuizState('completed');
    }
  };
  
  // Remove participant
  const removeParticipant = (userId) => {
    if (socket && roomId) {
      socket.emit('host:remove-participant', { roomId, userId });
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="large" />
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
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quiz controls */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Host Control Panel</h1>
              <div className="flex items-center">
                <span className="text-sm font-semibold mr-2">Room Code:</span>
                <span className="bg-gray-100 px-2 py-1 rounded font-mono font-bold">
                  {room?.roomCode}
                </span>
              </div>
            </div>
            
            {quizState === 'waiting' ? (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Waiting for participants</h2>
                <p className="text-gray-600 mb-6">
                  Share the room code with participants to join your quiz.
                </p>
                
                <Button
                  onClick={startQuiz}
                  disabled={participants.length === 0}
                  className="w-full py-3 text-lg"
                >
                  Start Quiz ({participants.length} participants)
                </Button>
              </div>
            ) : (
              <>
                {/* Quiz flow controls */}
                <div className="mb-6">
                  <QuizProgressDisplay 
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                  />
                </div>
                
                {/* Current question preview */}
                {currentQuestion && (
                  <QuestionPreview 
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                  />
                )}
                
                {/* Timer controls */}
                {quizState === 'active' && !showingResults && (
                  <TimerControl
                    timeLimit={currentQuestion?.timeLimit || room?.quiz?.settings?.timePerQuestion || 30}
                    isPaused={quizState === 'paused'}
                  />
                )}
                
                {/* Answer statistics */}
                {showingResults && answerStats && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Question Results</h3>
                    <AnswerDistribution 
                      statistics={answerStats}
                      question={currentQuestion}
                    />
                  </div>
                )}
                
                {/* Control buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {quizState === 'active' && !showingResults && (
                    <Button onClick={pauseQuiz} variant="secondary">
                      Pause Quiz
                    </Button>
                  )}
                  
                  {quizState === 'paused' && (
                    <Button onClick={resumeQuiz}>
                      Resume Quiz
                    </Button>
                  )}
                  
                  {showingResults && (
                    <Button onClick={nextQuestion}>
                      {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'End Quiz'}
                    </Button>
                  )}
                  
                  {quizState !== 'waiting' && quizState !== 'completed' && (
                    <Button 
                      onClick={endQuiz} 
                      variant="danger"
                      className="ml-auto"
                    >
                      End Quiz Early
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
        
        {/* Right column: Participant list */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-xl font-bold mb-4">Participants ({participants.length})</h2>
            
            <ParticipantList 
              participants={participants}
              showControls
              onRemove={removeParticipant}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveQuizHostPage; 