import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import FinalLeaderboard from '../../components/LiveQuiz/FinalLeaderboard';
import ResultsSummary from '../../components/Quiz/Results/ResultsSummary';
import QuestionBreakdown from '../../components/Quiz/Results/QuestionBreakdown';
import { useAuth } from '../../context/AuthContext';

const LiveQuizResultsPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [results, setResults] = useState(null);
  const [userResult, setUserResult] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/live-quizzes/${roomId}/results`);
        
        if (data.success) {
          setResults(data.data);
          
          // Find user's result in the participants
          if (user) {
            const participant = data.data.participants.find(p => p.userId === user.id);
            if (participant) {
              setUserResult(participant);
            }
          }
        } else {
          setError('Failed to load results');
          toast.error('Failed to load results');
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Results not found or you do not have permission to view them');
        toast.error('Error loading results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [roomId, user]);
  
  // Share results
  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `${results?.quiz?.title || 'Quiz'} Results`,
        text: `I scored ${userResult?.score || 0} points in ${results?.quiz?.title || 'a quiz'}!`,
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback - copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
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
  
  // No results yet
  if (!results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <h1 className="text-2xl font-bold mb-4">Results Not Available</h1>
          <p className="mb-6">The quiz results are not available yet.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Quiz Results</h1>
      
      {/* Quiz Info */}
      <Card className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{results.quiz.title}</h2>
        <div className="flex flex-wrap gap-4 text-gray-600">
          <div>
            <span className="font-semibold">Total Participants:</span> {results.participants.length}
          </div>
          <div>
            <span className="font-semibold">Quiz Date:</span> {new Date(results.startedAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Duration:</span> {Math.floor(results.duration / 60)} min {results.duration % 60} sec
          </div>
        </div>
      </Card>
      
      {/* User's result highlight */}
      {userResult && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold mb-4">Your Result</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-gray-600 mb-1">Rank</p>
              <p className="text-3xl font-bold text-blue-600">#{userResult.rank}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Score</p>
              <p className="text-3xl font-bold text-blue-600">{userResult.score}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Correct Answers</p>
              <p className="text-3xl font-bold text-blue-600">{userResult.answersCorrect}/{userResult.totalQuestions}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button onClick={shareResults}>
              Share Results
            </Button>
          </div>
        </Card>
      )}
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'leaderboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'questions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('questions')}
        >
          Question Breakdown
        </button>
        {userResult && (
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'personal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('personal')}
          >
            Your Performance
          </button>
        )}
      </div>
      
      {/* Tab content */}
      <Card>
        {activeTab === 'leaderboard' && (
          <>
            <h2 className="text-xl font-bold mb-6">Final Leaderboard</h2>
            <FinalLeaderboard 
              participants={results.participants}
              currentUserId={user?.id}
            />
          </>
        )}
        
        {activeTab === 'questions' && (
          <>
            <h2 className="text-xl font-bold mb-6">Question Breakdown</h2>
            <QuestionBreakdown 
              questions={results.questions}
            />
          </>
        )}
        
        {activeTab === 'personal' && userResult && (
          <>
            <h2 className="text-xl font-bold mb-6">Your Performance</h2>
            <ResultsSummary 
              result={{
                totalScore: userResult.score,
                maxPossibleScore: results.questions.length * 10, // assuming 10 points per question
                percentageScore: (userResult.score / (results.questions.length * 10)) * 100,
                timeTaken: results.duration,
                answers: userResult.answers || []
              }}
            />
          </>
        )}
      </Card>
      
      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
        <Button 
          variant="secondary"
          onClick={() => navigate('/live-quiz/join')}
        >
          Join Another Quiz
        </Button>
      </div>
    </div>
  );
};

export default LiveQuizResultsPage; 