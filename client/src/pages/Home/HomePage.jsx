import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import { getSharedQuiz } from '../../services/quizService';
import Loader from '../../components/Loader/Loader';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredQuizzes, setFeaturedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    // Simulate fetching featured quizzes
    // In a real app, you would call an API endpoint
    const demoFeaturedQuizzes = [
      {
        _id: '1',
        title: 'Science Quiz',
        description: 'Test your knowledge of basic science concepts',
        questions: Array(10).fill({}),
        coverImage: 'https://source.unsplash.com/random/400x300/?science',
        creator: { name: 'Science Teacher' },
        createdAt: new Date('2023-05-15').toISOString(),
        tags: ['science', 'education'],
        participantCount: 1250,
      },
      {
        _id: '2',
        title: 'History Trivia',
        description: 'Challenge yourself with these historical facts and events',
        questions: Array(15).fill({}),
        coverImage: 'https://source.unsplash.com/random/400x300/?history',
        creator: { name: 'History Buff' },
        createdAt: new Date('2023-06-22').toISOString(),
        tags: ['history', 'trivia'],
        participantCount: 843,
      },
      {
        _id: '3',
        title: 'Movie Knowledge Test',
        description: 'How well do you know classic and modern films?',
        questions: Array(20).fill({}),
        coverImage: 'https://source.unsplash.com/random/400x300/?movie',
        creator: { name: 'Film Expert' },
        createdAt: new Date('2023-07-10').toISOString(),
        tags: ['movies', 'entertainment'],
        participantCount: 2130,
      },
    ];

    setFeaturedQuizzes(demoFeaturedQuizzes);
    setLoading(false);
  }, []);

  const handleTakeQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setJoinError('');
    
    if (!roomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    
    navigate(`/live-quiz/join?code=${roomCode}`);
  };

  const handleCreateQuiz = () => {
    navigate('/create');
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 mb-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to QuizZone</h1>
          <p className="text-xl md:text-2xl mb-8">
            Create, share, and participate in interactive quizzes with friends, students, or colleagues
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={handleCreateQuiz}
              icon="➕"
            >
              Create New Quiz
            </Button>
            
            <form onSubmit={handleJoinRoom} className="flex flex-col md:flex-row gap-2">
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                error={joinError}
                className="w-full md:w-auto"
                inputClassName="h-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60"
              />
              <Button variant="success" size="lg" type="submit">
                Join Live Quiz
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="mb-12">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search for quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              startAdornment={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Button variant="primary" type="submit">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Featured Quizzes Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Quizzes</h2>
          <Button variant="text" onClick={() => navigate('/explore')}>
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredQuizzes.map((quiz) => (
            <Card
              key={quiz._id}
              title={quiz.title}
              subtitle={`By ${quiz.creator.name} • ${quiz.questions.length} Questions`}
              description={quiz.description}
              image={quiz.coverImage}
              onClick={() => handleTakeQuiz(quiz._id)}
              badges={quiz.tags.map(tag => ({ text: tag, variant: 'secondary' }))}
              footer={
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {quiz.participantCount.toLocaleString()} participants
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTakeQuiz(quiz._id);
                    }}
                  >
                    Take Quiz
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mb-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="text-lg font-semibold mb-2">Create a Quiz</h3>
            <p className="text-gray-600">Design your quiz with multiple question types, timers, and custom settings</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-lg font-semibold mb-2">Share with Others</h3>
            <p className="text-gray-600">Generate a unique code or link that you can share with participants</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-lg font-semibold mb-2">Get Results Instantly</h3>
            <p className="text-gray-600">View real-time responses, analytics, and detailed performance metrics</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="text-center bg-gray-800 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to Create Your Own Quiz?</h2>
        <p className="mb-6 text-gray-300">Join thousands of educators, trainers, and quiz enthusiasts on QuizZone</p>
        <Button variant="primary" size="lg" onClick={handleCreateQuiz}>
          Get Started Now
        </Button>
      </section>
    </div>
  );
};

export default HomePage; 