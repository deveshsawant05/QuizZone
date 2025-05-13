import React from 'react';
import PropTypes from 'prop-types';

const WaitingIndicator = ({ message = 'Please wait...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-lg text-gray-700">{message}</p>
    </div>
  );
};

WaitingIndicator.propTypes = {
  message: PropTypes.string
};

export default WaitingIndicator; 