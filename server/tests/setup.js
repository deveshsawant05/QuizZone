const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../models/User');
const app = require('../server');

// Global variables
let mongoServer;

// Setup beforeAll hook
const setupDB = async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to in-memory database
  await mongoose.connect(mongoUri);
};

// Teardown afterAll hook
const teardownDB = async () => {
  // Disconnect from database
  await mongoose.disconnect();
  
  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Create test user and get tokens
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  const user = await User.create({
    ...defaultUser,
    ...userData
  });

  // Generate tokens
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '30m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'testrefreshsecret',
    { expiresIn: '7d' }
  );

  // Add refresh token to user
  user.refreshTokens = [refreshToken];
  await user.save();

  return {
    user,
    accessToken,
    refreshToken
  };
};

module.exports = {
  setupDB,
  teardownDB,
  createTestUser,
  app
}; 