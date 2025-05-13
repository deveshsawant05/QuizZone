import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCreatedQuizzes, getRecentAttempts } from '../../services/quizService';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [quizzesData, attemptsData] = await Promise.all([
          getCreatedQuizzes(),
          getRecentAttempts()
        ]);
        
        setCreatedQuizzes(quizzesData || []);
        setRecentAttempts(attemptsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCreateQuiz = () => {
    navigate('/create');
  };

  const handleShareQuiz = (e, quiz) => {
    e.stopPropagation();
    
    if (!quiz.isPublished) {
      toast.error('This quiz is not published yet');
      return;
    }
    
    if (!quiz.shareCode) {
      toast.error('This quiz has no share code. Try republishing it.');
      return;
    }
    
    // Create share URL with shareCode
    const shareUrl = `${window.location.origin}/quiz/${quiz.shareCode}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Quiz share link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy share link: ', err);
        toast.error('Failed to copy share link');
      });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name || 'User'}!</h1>
        <Button 
          variant="primary" 
          onClick={handleCreateQuiz}
          icon="plus"
        >
          Create Quiz
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Created Quizzes Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">My Quizzes</h2>
            {createdQuizzes.length > 0 && (
              <Button 
                variant="text" 
                onClick={() => navigate('/dashboard/quizzes')}
              >
                View All
              </Button>
            )}
          </div>
          
          {createdQuizzes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't created any quizzes yet</p>
              <Button 
                variant="outline" 
                onClick={handleCreateQuiz}
              >
                Create Your First Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {createdQuizzes.slice(0, 3).map(quiz => (
                <Card 
                  key={quiz._id}
                  title={quiz.title}
                  subtitle={`${quiz.questions?.length || 0} questions • Created ${new Date(quiz.createdAt).toLocaleDateString()}`}
                  image={quiz.coverImage}
                  onClick={() => navigate(`/quiz/${quiz._id}/edit`)}
                  badges={[
                    { text: quiz.isPublished ? 'Published' : 'Draft', variant: quiz.isPublished ? 'success' : 'warning' },
                    { text: quiz.type, variant: 'info' }
                  ]}
                  actionButtons={[
                    { text: 'Edit', onClick: (e) => { e.stopPropagation(); navigate(`/quiz/${quiz._id}/edit`); }, variant: 'outline' },
                    { text: 'Share', onClick: (e) => handleShareQuiz(e, quiz), variant: 'text', disabled: !quiz.isPublished }
                  ]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Recent Attempts</h2>
            {recentAttempts.length > 0 && (
              <Button 
                variant="text" 
                onClick={() => navigate('/dashboard/history')}
              >
                View History
              </Button>
            )}
          </div>
          
          {recentAttempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't taken any quizzes yet</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Discover Quizzes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAttempts.slice(0, 3).map(attempt => (
                <Card 
                  key={attempt._id}
                  title={attempt.quiz.title}
                  subtitle={`Score: ${attempt.score}/${attempt.maxScore} • ${new Date(attempt.completedAt).toLocaleDateString()}`}
                  onClick={() => {
                    // Navigate to results page
                    navigate(`/quiz/${attempt.quiz._id}/results/${attempt._id}`);
                  }}
                  badges={[
                    { 
                      text: `${Math.round((attempt.score / attempt.maxScore) * 100)}%`, 
                      variant: (attempt.score / attempt.maxScore) >= 0.7 ? 'success' : 'danger' 
                    }
                  ]}
                  actionButtons={[
                    { text: 'View Results', onClick: (e) => { e.stopPropagation(); navigate(`/quiz/${attempt.quiz._id}/results/${attempt._id}`); }, variant: 'outline' },
                    { text: 'Retry Quiz', onClick: (e) => { 
                      e.stopPropagation(); 
                      if (attempt.quiz.shareCode) {
                        navigate(`/quiz/${attempt.quiz.shareCode}`);
                      } else {
                        toast.error('This quiz does not have a share code. It may need to be republished.');
                      }
                    }, variant: 'text' }
                  ]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Analytics Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Created Quizzes</p>
            <p className="text-3xl font-bold text-blue-800">{createdQuizzes.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Completed Quizzes</p>
            <p className="text-3xl font-bold text-green-800">{recentAttempts.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Average Score</p>
            <p className="text-3xl font-bold text-purple-800">
              {recentAttempts.length === 0 
                ? 'N/A' 
                : `${Math.round(recentAttempts.reduce((acc, curr) => 
                    acc + (curr.score / curr.maxScore * 100), 0) / recentAttempts.length)}%`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 