import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="text-6xl font-bold text-blue-600 mb-4">404</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-3">Page Not Found</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        We couldn't find the page you were looking for. It might have been moved, deleted, or never existed.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          as={Link}
          to="/"
          variant="primary"
        >
          Go to Homepage
        </Button>
        <Button 
          as={Link}
          to="/dashboard"
          variant="outline"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage; 