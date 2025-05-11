const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB, app } = require('../setup');
const User = require('../../models/User');

beforeAll(async () => {
  await setupDB();
});

afterAll(async () => {
  await teardownDB();
});

// Clear users collection before each test
beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Check the response
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify user was created in DB
      const user = await User.findOne({ email: userData.email });
      expect(user).not.toBeNull();
      expect(user.name).toBe(userData.name);
    });

    it('should return error when email already exists', async () => {
      // Create a user first
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      // Try to register with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already in use');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user and return tokens', async () => {
      // Create a user first
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.name).toBe(user.name);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return error with invalid credentials', async () => {
      // Create a user first
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should return a new access token with valid refresh token', async () => {
      // Create a user and get tokens
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      
      // Generate JWT refresh token
      const jwt = require('jsonwebtoken');
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'testrefreshsecret',
        { expiresIn: '7d' }
      );
      
      // Add refresh token to user
      user.refreshTokens = [refreshToken];
      await user.save();

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return error with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalidtoken' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user and remove refresh token', async () => {
      // Create a user and get tokens
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      
      // Generate JWT tokens
      const jwt = require('jsonwebtoken');
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

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify token was removed from user
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshTokens).not.toContain(refreshToken);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      // Create a user and get token
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      
      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '30m' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', user._id.toString());
      expect(response.body.data.name).toBe(user.name);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return error if not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should process forgot password request', async () => {
      // Create a user first
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset link sent to your email');

      // Verify reset token was set
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpire).toBeDefined();
    });

    // For security reasons, the endpoint returns success even for non-existent emails
    it('should return success response even if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset link sent to your email');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Create a user with reset token
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      
      // Generate reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Set reset token and expiry
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password has been reset successfully');

      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.matchPassword('newpassword123');
      expect(isMatch).toBe(true);
      
      // Verify token was cleared
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpire).toBeUndefined();
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalidtoken',
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
}); 