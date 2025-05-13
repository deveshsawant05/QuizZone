import React from 'react';
import { Link } from 'react-router-dom';
import quizLogo from '../../assets/quiz-logo.svg';

const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Link to="/">
            <img 
              src={quizLogo} 
              alt="QuizZone Logo" 
              className="mx-auto h-16 w-auto"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <div className="mt-6 text-center text-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCard; 