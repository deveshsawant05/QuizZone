import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext';
import { useError } from './context/ErrorContext';
import DebugPanel from './components/ErrorHandling/DebugPanel';
import AuthDebugPanel from './components/ErrorHandling/AuthDebugPanel';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CreateQuizPage from './pages/Quiz/CreateQuizPage';
import EditQuizPage from './pages/Quiz/EditQuizPage';
import QuizPlayerPage from './pages/Quiz/QuizPlayerPage';
import QuizResultsPage from './pages/Quiz/QuizResultsPage';
import LiveQuizLobbyPage from './pages/LiveQuiz/LiveQuizLobbyPage';
import LiveQuizHostPage from './pages/LiveQuiz/LiveQuizHostPage';
import LiveQuizPlayerPage from './pages/LiveQuiz/LiveQuizPlayerPage';
import LiveQuizResultsPage from './pages/LiveQuiz/LiveQuizResultsPage';
import QuestionBankPage from './pages/QuestionBank/QuestionBankPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import Loader from './components/Loader/Loader';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  
  // Add some debug logging to help diagnose authentication issues
  console.log('ProtectedRoute check:', {
    hasUser: !!user,
    userId: user?.id || user?._id,
    isAuthenticated,
    isInitialized,
    loading,
    tokenExists: !!localStorage.getItem('accessToken'),
    refreshTokenExists: !!localStorage.getItem('refreshToken'),
    path: window.location.pathname
  });
  
  if (loading || !isInitialized) {
    return <Loader.WithText text="Authenticating..." fullScreen />;
  }
  
  if (!isAuthenticated || !user) {
    // Add a short delay before redirect to allow for any pending auth operations
    console.warn('Authentication required - redirecting to login');
    
    setTimeout(() => {
      // Remove any stale tokens since authentication failed
      if (!isAuthenticated && localStorage.getItem('accessToken')) {
        console.warn('Removing stale tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }, 100);
    
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { user, loading, isInitialized } = useAuth();
  const { isDebugMode } = useError();

  if (loading && !isInitialized) {
    return <Loader.WithText text="Loading..." fullScreen />;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Main Layout Routes */}
          <Route path="/" element={<MainLayout user={user} />}>
            <Route index element={<HomePage />} />
            <Route path="quiz/:shareCode" element={<QuizPlayerPage />} />
            <Route path="quiz/:quizId/results/:attemptId" element={<QuizResultsPage />} />
            <Route path="live-quiz/join" element={<LiveQuizLobbyPage />} />
            <Route path="live-quiz/:roomId/play" element={<LiveQuizPlayerPage />} />
            <Route path="live-quiz/:roomId/results" element={<LiveQuizResultsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Auth Layout Routes - Only accessible when not logged in */}
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" replace /> : <AuthLayout />}
          >
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password/:token" element={<ResetPasswordPage />} />
          </Route>

          {/* Dashboard Layout Routes (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout user={user} />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="analytics" element={<div>Analytics Page</div>} />
            <Route path="quizzes" element={<div>My Quizzes Page</div>} />
            <Route path="history" element={<div>Quiz History Page</div>} />
          </Route>

          {/* Quiz Creation & Management Routes (Protected) */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <MainLayout user={user} />
              </ProtectedRoute>
            }
          >
            <Route index element={<CreateQuizPage />} />
          </Route>
          
          <Route
            path="/quiz/:quizId/edit"
            element={
              <ProtectedRoute>
                <MainLayout user={user} />
              </ProtectedRoute>
            }
          >
            <Route index element={<EditQuizPage />} />
          </Route>
          
          {/* Live Quiz Host Routes (Protected) */}
          <Route
            path="/live-quiz/:roomId/host"
            element={
              <ProtectedRoute>
                <MainLayout user={user} minimal />
              </ProtectedRoute>
            }
          >
            <Route index element={<LiveQuizHostPage />} />
          </Route>
          
          {/* Question Bank Routes (Protected) */}
          <Route
            path="/question-bank"
            element={
              <ProtectedRoute>
                <MainLayout user={user} />
              </ProtectedRoute>
            }
          >
            <Route index element={<QuestionBankPage />} />
          </Route>
          
          {/* Profile Routes (Protected) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout user={user} />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      {/* Debug Panels - Only visible in debug mode */}
      {isDebugMode && (
        <>
          <DebugPanel position="bottom-right" />
          <AuthDebugPanel position="bottom-left" />
        </>
      )}
    </>
  );
}

export default App;
