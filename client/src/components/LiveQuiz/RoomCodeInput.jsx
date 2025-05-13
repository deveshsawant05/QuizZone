import React, { useState } from 'react';
import PropTypes from 'prop-types';

const RoomCodeInput = ({ value, onChange, onSubmit }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
        Enter Room Code
      </label>
      <div className="flex">
        <input
          type="text"
          id="roomCode"
          placeholder="ABCDEF"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 text-lg font-mono text-center tracking-widest uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={6}
          autoComplete="off"
        />
      </div>
      <p className="mt-2 text-sm text-gray-500 text-center">
        Enter the 6-digit code provided by the quiz host
      </p>
    </div>
  );
};

RoomCodeInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default RoomCodeInput; 