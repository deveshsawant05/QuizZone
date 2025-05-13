import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  HomeIcon,
  ChartBarIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import quizLogo from '../assets/quiz-logo.svg';

const DashboardLayout = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: location.pathname === '/dashboard' },
    { name: 'Create Quiz', href: '/create', icon: PencilSquareIcon, current: location.pathname === '/create' },
    { name: 'My Quizzes', href: '/dashboard/quizzes', icon: DocumentTextIcon, current: location.pathname === '/dashboard/quizzes' },
    { name: 'Question Bank', href: '/question-bank', icon: BookOpenIcon, current: location.pathname === '/question-bank' },
    { name: 'Live Quizzes', href: '/dashboard/live', icon: PuzzlePieceIcon, current: location.pathname === '/dashboard/live' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon, current: location.pathname === '/dashboard/analytics' },
  ];

  const userNavigation = [
    { name: 'Your Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    { name: 'Sign out', href: '#', icon: ArrowRightOnRectangleIcon, onClick: handleLogout },
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
              <div className="absolute top-0 right-0 pt-2">
                <button
                  className="-mr-12 p-2 rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <SidebarContent
                navigation={navigation}
                userNavigation={userNavigation}
                user={user}
                mobile={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <SidebarContent
            navigation={navigation}
            userNavigation={userNavigation}
            user={user}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-white shadow-sm flex-shrink-0">
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="lg:hidden flex-1 flex justify-center">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src={quizLogo} alt="QuizZone" />
                <span className="ml-2 text-xl font-bold text-indigo-600">QuizZone</span>
              </Link>
            </div>
            <div className="flex items-center">
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-700 mr-2 hidden sm:block">
                    {user?.name || 'User'}
                  </div>
                  <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user?.name || 'User profile'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, userNavigation, user, mobile = false }) => {
  return (
    <>
      <div className="flex-shrink-0 flex items-center h-16 px-4">
        <Link to="/" className="flex items-center">
          <img className="h-8 w-auto" src={quizLogo} alt="QuizZone" />
          <span className="ml-2 text-xl font-bold text-indigo-600">QuizZone</span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md 
                ${item.current
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 flex-shrink-0 h-6 w-6
                  ${item.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className={mobile ? "pt-4" : ""}>
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={item.onClick}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout; 