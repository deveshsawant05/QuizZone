import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Components
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import RoomCodeInput from '../../components/LiveQuiz/RoomCodeInput';
import ParticipantList from '../../components/LiveQuiz/ParticipantList';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

const LiveQuizLobbyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get room code from URL search params if available
  const searchParams = new URLSearchParams(location.search);
  const initialRoomCode = searchParams.get('code') || '';
  
  // State
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Handle room code input
  const handleRoomCodeChange = (value) => {
    setRoomCode(value.toUpperCase());
  };
  
  // Validate and join room
  const validateAndJoinRoom = async () => {
    if (!roomCode || roomCode.length < 4) {
      toast.error('Please enter a valid room code');
      return;
    }
    
    setIsJoining(true);
    setError(null);
    
    try {
      // Verify room exists
      const { data } = await axios.get(`/api/live-quizzes/code/${roomCode}`);
      
      if (data.success) {
        const roomData = {
          roomId: data.data.roomId,
          sessionCode: data.data.sessionCode,
          status: data.data.status,
          quiz: data.data.quiz,
          host: data.data.host,
          participantCount: data.data.participantCount
        };
        
        setRoomData(roomData);
        joinRoom(roomData.roomId);
      } else {
        setError('Failed to join room');
        toast.error('Failed to join room');
      }
    } catch (err) {
      console.error('Error validating room:', err);
      const errorMessage = err.response?.data?.error || 'Invalid room code or the room does not exist';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Join room via WebSocket
  const joinRoom = (roomId) => {
    // Initialize socket connection
    const newSocket = io('/live-quiz', {
      auth: {
        token: localStorage.getItem('accessToken')
      }
    });
    
    // Socket connection events
    newSocket.on('connect', () => {
      console.log('Socket connected');
      
      // Join the room
      newSocket.emit('join:room', {
        roomCode,
        name: user?.name || 'Anonymous'
      });
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Error connecting to game');
      setError(error.message || 'Error connecting to game');
    });
    
    newSocket.on('room:joined', (data) => {
      setIsJoined(true);
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
    
    newSocket.on('quiz:start', (data) => {
      // Navigate to the play page when quiz starts
      navigate(`/live-quiz/${roomId}/play`);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      toast.error('Disconnected from server');
    });
    
    setSocket(newSocket);
  };
  
  // Toggle ready status
  const toggleReady = () => {
    if (socket && roomData) {
      setIsReady(prev => !prev);
      socket.emit('ready:status', {
        roomId: roomData.roomId,
        ready: !isReady
      });
    }
  };
  
  // Leave room
  const leaveRoom = () => {
    if (socket && roomData) {
      socket.emit('leave:room', {
        roomId: roomData.roomId
      });
      socket.disconnect();
    }
    
    setIsJoined(false);
    setRoomData(null);
    setParticipants([]);
    setIsReady(false);
  };
  
  // Clean up socket connection on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);
  
  // Auto-join if room code is provided in URL
  useEffect(() => {
    if (initialRoomCode && !isJoined && !isJoining) {
      validateAndJoinRoom();
    }
  }, [initialRoomCode]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {!isJoined ? (
        <Card className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Join Live Quiz</h1>
          
          <RoomCodeInput 
            value={roomCode}
            onChange={handleRoomCodeChange}
            onSubmit={validateAndJoinRoom}
          />
          
          {error && (
            <div className="mt-4 text-red-600 text-center">
              {error}
            </div>
          )}
          
          <Button
            onClick={validateAndJoinRoom}
            className="w-full mt-6"
            disabled={isJoining || !roomCode}
            loading={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Quiz'}
          </Button>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{roomData?.quiz?.title}</h1>
              <div className="bg-gray-100 px-3 py-1 rounded-lg flex items-center">
                <span className="font-semibold mr-2">Room Code:</span>
                <span className="text-xl font-mono font-bold">{roomCode}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Waiting for host to start the game...</h2>
              <p className="text-gray-600">
                {roomData?.quiz?.description || 'Get ready for the quiz!'}
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3">Participants: {participants.length}</h3>
              <ParticipantList participants={participants} />
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between mt-8">
              <Button
                onClick={toggleReady}
                className={isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {isReady ? 'Ready ✓' : 'Ready?'}
              </Button>
              
              <Button
                onClick={leaveRoom}
                variant="secondary"
              >
                Leave Room
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveQuizLobbyPage; 