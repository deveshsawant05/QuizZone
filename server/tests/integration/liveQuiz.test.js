const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB, createTestUser, app } = require('../setup');
const User = require('../../models/User');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const LiveQuiz = require('../../models/LiveQuiz');

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
  await Question.deleteMany({});
  await LiveQuiz.deleteMany({});
});

describe('LiveQuiz API Routes', () => {
  describe('POST /api/live-quizzes', () => {
    it('should create a live quiz room', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz first
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Add some questions
      await Question.create({
        quizId: quiz._id,
        questionText: 'Test question?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ]
      });

      const liveQuizData = {
        quizId: quiz._id,
        settings: {
          waitForHost: true,
          showLeaderboardAfterEachQuestion: true,
          allowLateJoin: true
        }
      };

      const response = await request(app)
        .post('/api/live-quizzes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(liveQuizData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Live quiz session created successfully');
      expect(response.body.data.liveQuiz).toHaveProperty('_id');
      expect(response.body.data.liveQuiz).toHaveProperty('sessionCode');

      // Verify live quiz was created in DB
      const liveQuiz = await LiveQuiz.findById(response.body.data.liveQuiz._id);
      expect(liveQuiz).not.toBeNull();
      
      // Handle the populated quiz object correctly by checking if it's an object or ID
      const quizId = typeof liveQuiz.quiz === 'object' ? liveQuiz.quiz._id.toString() : liveQuiz.quiz.toString();
      expect(quizId).toBe(quiz._id.toString());
      
      // Handle the populated host object correctly
      const hostId = typeof liveQuiz.host === 'object' ? liveQuiz.host._id.toString() : liveQuiz.host.toString();
      expect(hostId).toBe(user._id.toString());
      
      expect(liveQuiz.status).toBe('waiting');
    });

    it('should return error if quiz does not exist', async () => {
      const { accessToken } = await createTestUser();
      const nonExistentId = new mongoose.Types.ObjectId();

      const liveQuizData = {
        quizId: nonExistentId,
        settings: {}
      };

      const response = await request(app)
        .post('/api/live-quizzes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(liveQuizData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(`Quiz not found with id of ${nonExistentId}`);
    });
  });

  describe('GET /api/live-quizzes', () => {
    it('should get all live quizzes created by user', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create some live quiz rooms
      await LiveQuiz.create([
        {
          quiz: quiz._id,
          host: user._id,
          sessionCode: 'CODE1',
          status: 'waiting'
        },
        {
          quiz: quiz._id,
          host: user._id,
          sessionCode: 'CODE2',
          status: 'completed'
        }
      ]);

      const response = await request(app)
        .get('/api/live-quizzes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.liveQuizzes).toHaveLength(2);
    });
  });

  describe('GET /api/live-quizzes/:id', () => {
    it('should get live quiz by ID', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a live quiz room
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'waiting'
      });

      const response = await request(app)
        .get(`/api/live-quizzes/${liveQuiz._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.liveQuiz._id).toBe(liveQuiz._id.toString());
      expect(response.body.data.liveQuiz.sessionCode).toBe(liveQuiz.sessionCode);
      expect(response.body.data.liveQuiz.status).toBe(liveQuiz.status);
    });

    it('should return error for non-existent live quiz', async () => {
      const { accessToken } = await createTestUser();
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/live-quizzes/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(`Resource not found`);
    });
  });

  describe('GET /api/live-quizzes/code/:sessionCode', () => {
    it('should get live quiz by room code', async () => {
      const { user } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a live quiz room
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'waiting'
      });

      const response = await request(app)
        .get('/api/live-quizzes/code/TESTCODE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionCode', 'TESTCODE');
      expect(response.body.data).toHaveProperty('status', 'waiting');
    });

    it('should return error for invalid room code', async () => {
      const response = await request(app)
        .get('/api/live-quizzes/code/INVALIDCODE')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid session code');
    });
  });

  describe('PUT /api/live-quizzes/:id/settings', () => {
    it('should update live quiz settings', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a live quiz room
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'waiting',
        settings: {
          waitForHost: true,
          allowLateJoin: true
        }
      });

      const updateData = {
        waitForHost: false,
        allowLateJoin: false,
        participantLimit: 50
      };

      const response = await request(app)
        .put(`/api/live-quizzes/${liveQuiz._id}/settings`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.liveQuiz.settings.waitForHost).toBe(false);
      expect(response.body.data.liveQuiz.settings.allowLateJoin).toBe(false);
      expect(response.body.data.liveQuiz.settings.participantLimit).toBe(50);

      // Verify DB was updated
      const updatedLiveQuiz = await LiveQuiz.findById(liveQuiz._id);
      expect(updatedLiveQuiz.settings.waitForHost).toBe(false);
      expect(updatedLiveQuiz.settings.allowLateJoin).toBe(false);
    });

    it('should deny update for non-host user', async () => {
      const { user } = await createTestUser();
      const { accessToken: otherToken } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a live quiz room
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'waiting'
      });

      const updateData = {
        waitForHost: false
      };

      const response = await request(app)
        .put(`/api/live-quizzes/${liveQuiz._id}/settings`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to update this live quiz session');
    });
  });

  describe('PUT /api/live-quizzes/:id/end', () => {
    it('should end a live quiz', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a live quiz room
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'active',
        startedAt: new Date(Date.now() - 1000 * 60 * 5) // Started 5 minutes ago
      });

      const response = await request(app)
        .put(`/api/live-quizzes/${liveQuiz._id}/end`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Live quiz session ended successfully');

      // Verify DB was updated
      const updatedLiveQuiz = await LiveQuiz.findById(liveQuiz._id);
      expect(updatedLiveQuiz.status).toBe('completed');
    });

    it('should deny ending quiz for non-host user', async () => {
      const { user } = await createTestUser();
      const { accessToken: otherToken } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a live quiz room
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'active'
      });

      const response = await request(app)
        .put(`/api/live-quizzes/${liveQuiz._id}/end`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to end this live quiz session');
    });
  });

  describe('GET /api/live-quizzes/:id/results', () => {
    it('should get results for a completed live quiz', async () => {
      const { user, accessToken } = await createTestUser();
      const otherUser = await User.create({
        name: 'Participant',
        email: 'participant@example.com',
        password: 'password123'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a question
      const question = await Question.create({
        quizId: quiz._id,
        questionText: 'Test question?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ],
        points: 10
      });

      // Create a completed live quiz with participants
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'completed',
        startedAt: new Date(Date.now() - 1000 * 60 * 10), // Started 10 minutes ago
        endedAt: new Date(),
        participants: [
          {
            userId: otherUser._id,
            name: otherUser.name,
            score: 10,
            answers: [
              {
                questionId: question._id,
                selectedOptionId: question.options[0]._id,
                isCorrect: true,
                points: 10,
                timeTaken: 15
              }
            ]
          }
        ],
        questionResults: [
          {
            questionId: question._id,
            correctAnswers: 1,
            incorrectAnswers: 0,
            averageResponseTime: 15,
            optionDistribution: [
              {
                optionId: question.options[0]._id,
                count: 1,
                percentage: 100
              },
              {
                optionId: question.options[1]._id,
                count: 0,
                percentage: 0
              }
            ]
          }
        ]
      });

      const response = await request(app)
        .get(`/api/live-quizzes/${liveQuiz._id}/results`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveProperty('quizTitle');
      expect(response.body.data.results).toHaveProperty('participants');
      expect(response.body.data.results.participants).toHaveLength(1);
      expect(response.body.data.results).toHaveProperty('questionStats');
      expect(response.body.data.results.questionStats).toHaveLength(1);
    });

    it('should deny access for non-host user', async () => {
      const { user } = await createTestUser();
      const { accessToken: otherToken } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create a completed live quiz
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'completed',
        startedAt: new Date(Date.now() - 1000 * 60 * 5),
        endedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/live-quizzes/${liveQuiz._id}/results`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to view results of this live quiz session');
    });

    it('should return error if quiz is not completed', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id,
        isPublished: true
      });

      // Create an active live quiz
      const liveQuiz = await LiveQuiz.create({
        quiz: quiz._id,
        host: user._id,
        sessionCode: 'TESTCODE',
        status: 'active',
        startedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/live-quizzes/${liveQuiz._id}/results`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quiz is not completed yet');
    });
  });
}); 