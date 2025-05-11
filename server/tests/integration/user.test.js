const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB, createTestUser, app } = require('../setup');
const User = require('../../models/User');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');

beforeAll(async () => {
  await setupDB();
});

afterAll(async () => {
  await teardownDB();
});

// Clear collections before each test
beforeEach(async () => {
  await User.deleteMany({});
  await Quiz.deleteMany({});
  await QuizAttempt.deleteMany({});
});

describe('User API Routes', () => {
  describe('GET /api/users/profile', () => {
    it('should return user profile', async () => {
      const { user, accessToken } = await createTestUser();

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(user._id.toString());
      expect(response.body.data.user.name).toBe(user.name);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should return error if not authenticated', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const { user, accessToken } = await createTestUser();

      const updatedProfile = {
        name: 'Updated Name',
        profilePicture: 'https://example.com/avatar.jpg'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.name).toBe(updatedProfile.name);
      expect(response.body.data.user.profilePicture).toBe(updatedProfile.profilePicture);

      // Verify DB was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe(updatedProfile.name);
      expect(updatedUser.profilePicture).toBe(updatedProfile.profilePicture);
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change user password', async () => {
      const { user, accessToken } = await createTestUser();

      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');

      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.matchPassword('newpassword123');
      expect(isMatch).toBe(true);
    });

    it('should return error with incorrect current password', async () => {
      const { accessToken } = await createTestUser();

      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is incorrect');
    });
  });

  describe('GET /api/users/dashboard', () => {
    it('should return user dashboard statistics', async () => {
      const { user, accessToken } = await createTestUser();

      // Create some quizzes for the user
      await Quiz.create({
        title: 'Test Quiz 1',
        description: 'Description for test quiz 1',
        creator: user._id,
        isPublished: true
      });

      await Quiz.create({
        title: 'Test Quiz 2',
        description: 'Description for test quiz 2',
        creator: user._id,
        isPublished: false
      });

      const response = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dashboardStats).toHaveProperty('quizCount', 2);
      expect(response.body.data.dashboardStats).toHaveProperty('publishedQuizCount', 1);
      expect(response.body.data.dashboardStats).toHaveProperty('totalAttempts');
      expect(response.body.data.dashboardStats).toHaveProperty('recentQuizzes');
      expect(response.body.data.dashboardStats.recentQuizzes).toHaveLength(2);
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete user account', async () => {
      const { user, accessToken } = await createTestUser();

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user was deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('GET /api/users/me/attempts', () => {
    it('should return user quiz attempts', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: true
      });

      // Create quiz attempts
      await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date(),
        completedAt: new Date(),
        completed: true,
        score: 80,
        maxScore: 100,
        percentageScore: 80,
        passed: true
      });

      await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date(),
        completed: false
      });

      const response = await request(app)
        .get('/api/users/me/attempts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('attempts');
      expect(response.body.data.attempts).toHaveLength(2);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination and sorting', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: true
      });

      // Create multiple quiz attempts with different dates
      const dates = [
        new Date('2023-01-01'),
        new Date('2023-01-15'),
        new Date('2023-02-01'),
        new Date('2023-02-15')
      ];

      for (let i = 0; i < 4; i++) {
        await QuizAttempt.create({
          quiz: quiz._id,
          user: user._id,
          startedAt: dates[i],
          completedAt: dates[i],
          completed: true,
          score: 70 + i * 10,
          maxScore: 100,
          percentageScore: 70 + i * 10,
          passed: true
        });
      }

      // Test pagination - page 1, limit 2
      const response1 = await request(app)
        .get('/api/users/me/attempts?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body.data.attempts).toHaveLength(2);
      expect(response1.body.data.pagination.page).toBe(1);
      expect(response1.body.data.pagination.limit).toBe(2);
      expect(response1.body.data.pagination.total).toBe(4);
      expect(response1.body.data.pagination.pages).toBe(2);

      // Test pagination - page 2, limit 2
      const response2 = await request(app)
        .get('/api/users/me/attempts?page=2&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response2.body.data.attempts).toHaveLength(2);
      expect(response2.body.data.pagination.page).toBe(2);
    });
  });

  describe('GET /api/users/me/statistics', () => {
    it('should return user statistics and analytics', async () => {
      const { user, accessToken } = await createTestUser();

      // Create quizzes
      const quiz1 = await Quiz.create({
        title: 'Test Quiz 1',
        description: 'Description for test quiz 1',
        creator: user._id,
        isPublished: true,
        tags: ['javascript', 'programming']
      });

      const quiz2 = await Quiz.create({
        title: 'Test Quiz 2',
        description: 'Description for test quiz 2',
        creator: user._id,
        isPublished: false,
        tags: ['html', 'css', 'web']
      });

      // Create quiz attempts
      await QuizAttempt.create({
        quiz: quiz1._id,
        user: user._id,
        startedAt: new Date('2023-01-01T10:00:00'),
        completedAt: new Date('2023-01-01T10:20:00'),
        completed: true,
        score: 80,
        maxScore: 100,
        percentageScore: 80,
        passed: true
      });

      await QuizAttempt.create({
        quiz: quiz2._id,
        user: user._id,
        startedAt: new Date('2023-02-01T10:00:00'),
        completedAt: new Date('2023-02-01T10:15:00'),
        completed: true,
        score: 90,
        maxScore: 100,
        percentageScore: 90,
        passed: true
      });

      const response = await request(app)
        .get('/api/users/me/statistics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data.overview).toHaveProperty('totalQuizzesTaken', 2);
      expect(response.body.data.overview).toHaveProperty('totalQuizzesCreated', 2);
      expect(response.body.data.overview).toHaveProperty('averageScore');
      expect(response.body.data.overview).toHaveProperty('totalTimePlayed');
      expect(response.body.data.overview).toHaveProperty('favoriteTags');

      expect(response.body.data).toHaveProperty('quizzesTaken');
      expect(response.body.data.quizzesTaken).toHaveProperty('completed', 2);
      expect(response.body.data.quizzesTaken).toHaveProperty('passed', 2);

      expect(response.body.data).toHaveProperty('quizzesCreated');
      expect(response.body.data.quizzesCreated).toHaveProperty('total', 2);
      expect(response.body.data.quizzesCreated).toHaveProperty('published', 1);
      expect(response.body.data.quizzesCreated).toHaveProperty('drafts', 1);

      expect(response.body.data).toHaveProperty('performance');
      expect(response.body.data.performance).toHaveProperty('monthly');
      expect(response.body.data.performance).toHaveProperty('byTags');
    });
  });
}); 