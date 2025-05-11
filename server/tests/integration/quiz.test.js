const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB, createTestUser, app } = require('../setup');
const User = require('../../models/User');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
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
  await Question.deleteMany({});
  await QuizAttempt.deleteMany({});
});

describe('Quiz API Routes', () => {
  describe('POST /api/quizzes', () => {
    it('should create a new quiz', async () => {
      const { user, accessToken } = await createTestUser();

      const quizData = {
        title: 'Test Quiz',
        description: 'Test quiz description',
        coverImage: 'https://example.com/cover.jpg',
        type: 'static',
        settings: {
          timePerQuestion: 30,
          randomizeQuestions: true,
          showCorrectAnswers: true
        },
        tags: ['test', 'quiz']
      };

      const response = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(quizData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Quiz created successfully');
      expect(response.body.data.quiz).toHaveProperty('_id');
      expect(response.body.data.quiz.title).toBe(quizData.title);
      expect(response.body.data.quiz.description).toBe(quizData.description);
      expect(response.body.data.quiz.creator).toBe(user._id.toString());

      // Verify quiz was created in DB
      const quiz = await Quiz.findById(response.body.data.quiz._id);
      expect(quiz).not.toBeNull();
      expect(quiz.title).toBe(quizData.title);
    });

    it('should return error if not authenticated', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'Test quiz description'
      };

      const response = await request(app)
        .post('/api/quizzes')
        .send(quizData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/quizzes', () => {
    it('should get all quizzes created by current user', async () => {
      const { user, accessToken } = await createTestUser();

      // Create quizzes
      await Quiz.create([
        {
          title: 'Test Quiz 1',
          description: 'Description for test quiz 1',
          creator: user._id,
          isPublished: true
        },
        {
          title: 'Test Quiz 2',
          description: 'Description for test quiz 2',
          creator: user._id,
          isPublished: false
        }
      ]);

      const response = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quizzes).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support filtering by published status', async () => {
      const { user, accessToken } = await createTestUser();

      // Create quizzes
      await Quiz.create([
        {
          title: 'Test Quiz 1',
          description: 'Description for test quiz 1',
          creator: user._id,
          isPublished: true
        },
        {
          title: 'Test Quiz 2',
          description: 'Description for test quiz 2',
          creator: user._id,
          isPublished: false
        }
      ]);

      const response = await request(app)
        .get('/api/quizzes?isPublished=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quizzes).toHaveLength(1);
      expect(response.body.data.quizzes[0].isPublished).toBe(true);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    it('should get quiz by ID', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: true
      });

      const response = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quiz._id).toBe(quiz._id.toString());
      expect(response.body.data.quiz.title).toBe(quiz.title);
      expect(response.body.data.quiz.description).toBe(quiz.description);
    });

    it('should return error for non-existent quiz', async () => {
      const { accessToken } = await createTestUser();
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/quizzes/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(`Quiz not found with id of ${nonExistentId}`);
    });
  });

  describe('PUT /api/quizzes/:id', () => {
    it('should update a quiz', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Original Title',
        description: 'Original description',
        creator: user._id
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        settings: {
          timePerQuestion: 45
        }
      };

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quiz.title).toBe(updateData.title);
      expect(response.body.data.quiz.description).toBe(updateData.description);
      expect(response.body.data.quiz.settings.timePerQuestion).toBe(updateData.settings.timePerQuestion);

      // Verify DB was updated
      const updatedQuiz = await Quiz.findById(quiz._id);
      expect(updatedQuiz.title).toBe(updateData.title);
    });

    it('should deny update for non-creator', async () => {
      const { user } = await createTestUser();
      const { accessToken: otherToken } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Original Title',
        description: 'Original description',
        creator: user._id
      });

      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to update this quiz');
    });
  });

  describe('DELETE /api/quizzes/:id', () => {
    it('should delete a quiz', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id
      });

      const response = await request(app)
        .delete(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify quiz was deleted
      const deletedQuiz = await Quiz.findById(quiz._id);
      expect(deletedQuiz).toBeNull();
    });
  });

  describe('PUT /api/quizzes/:id/publish', () => {
    it('should publish a quiz with questions', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: false
      });

      // Add a question to the quiz
      await Question.create({
        quizId: quiz._id,
        questionText: 'Test question?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ]
      });

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}/publish`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quiz.isPublished).toBe(true);
      expect(response.body.data.quiz.shareCode).toBeDefined();

      // Verify DB was updated
      const updatedQuiz = await Quiz.findById(quiz._id);
      expect(updatedQuiz.isPublished).toBe(true);
      expect(updatedQuiz.shareCode).toBeDefined();
    });

    it('should deny publishing quiz with no questions', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz with no questions
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: false
      });

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}/publish`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot publish quiz with no questions');
    });
  });

  describe('GET /api/quizzes/shared/:shareCode', () => {
    it('should get quiz by share code', async () => {
      const { user } = await createTestUser();

      // Create a published quiz with share code
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: true,
        shareCode: 'testcode123'
      });

      const response = await request(app)
        .get('/api/quizzes/shared/testcode123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quiz._id).toBe(quiz._id.toString());
      expect(response.body.data.quiz.title).toBe(quiz.title);
    });

    it('should return error for invalid share code', async () => {
      const response = await request(app)
        .get('/api/quizzes/shared/invalidcode')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired share code');
    });
  });

  describe('POST /api/quizzes/:id/attempt', () => {
    it('should start a quiz attempt', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a published quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: true
      });

      const response = await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attempt).toHaveProperty('_id');
      expect(response.body.data.attempt.quiz.toString()).toBe(quiz._id.toString());
      expect(response.body.data.attempt.user.toString()).toBe(user._id.toString());
      expect(response.body.data.attempt.startedAt).toBeDefined();
      expect(response.body.data.attempt.completed).toBe(false);

      // Verify attempt was created in DB
      const attempt = await QuizAttempt.findById(response.body.data.attempt._id);
      expect(attempt).not.toBeNull();
    });

    it('should deny starting attempt for unpublished quiz', async () => {
      const { user, accessToken } = await createTestUser();

      // Create an unpublished quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Description for test quiz',
        creator: user._id,
        isPublished: false
      });

      const response = await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot attempt an unpublished quiz');
    });
  });

  describe('POST /api/quizzes/attempt/:attemptId/answer', () => {
    it('should submit an answer for a quiz attempt', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
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

      // Create an attempt
      const attempt = await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date()
      });

      // Submit answer
      const answerData = {
        questionId: question._id,
        selectedOptionId: question.options[0]._id, // Correct option
        timeTaken: 15
      };

      const response = await request(app)
        .post(`/api/quizzes/attempt/${attempt._id}/answer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(answerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isCorrect).toBe(true);
      expect(response.body.data.points).toBe(10);

      // Verify answer was saved
      const updatedAttempt = await QuizAttempt.findById(attempt._id);
      expect(updatedAttempt.answers).toHaveLength(1);
      expect(updatedAttempt.answers[0].questionId.toString()).toBe(question._id.toString());
      expect(updatedAttempt.answers[0].isCorrect).toBe(true);
    });

    it('should handle incorrect answers', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
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

      // Create an attempt
      const attempt = await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date()
      });

      // Submit answer (incorrect)
      const answerData = {
        questionId: question._id,
        selectedOptionId: question.options[1]._id, // Incorrect option
        timeTaken: 15
      };

      const response = await request(app)
        .post(`/api/quizzes/attempt/${attempt._id}/answer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(answerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isCorrect).toBe(false);
      expect(response.body.data.points).toBe(0);
    });
  });

  describe('PUT /api/quizzes/attempt/:attemptId/complete', () => {
    it('should complete a quiz attempt', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        creator: user._id,
        isPublished: true,
        settings: {
          passingScore: 70
        }
      });

      // Create questions
      const question1 = await Question.create({
        quizId: quiz._id,
        questionText: 'Question 1?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ],
        points: 10
      });

      const question2 = await Question.create({
        quizId: quiz._id,
        questionText: 'Question 2?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ],
        points: 10
      });

      // Create an attempt with answers
      const attempt = await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date(),
        answers: [
          {
            questionId: question1._id,
            selectedOptionId: question1.options[0]._id,
            isCorrect: true,
            points: 10
          },
          {
            questionId: question2._id,
            selectedOptionId: question2.options[1]._id,
            isCorrect: false,
            points: 0
          }
        ]
      });

      const response = await request(app)
        .put(`/api/quizzes/attempt/${attempt._id}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attempt.completed).toBe(true);
      expect(response.body.data.attempt.completedAt).toBeDefined();
      expect(response.body.data.attempt.score).toBe(10);
      expect(response.body.data.attempt.maxScore).toBe(20);
      expect(response.body.data.attempt.percentageScore).toBe(50);
      expect(response.body.data.attempt.passed).toBe(false); // 50% < 70% passing score

      // Verify DB was updated
      const updatedAttempt = await QuizAttempt.findById(attempt._id);
      expect(updatedAttempt.completed).toBe(true);
      expect(updatedAttempt.completedAt).toBeDefined();
    });
  });

  describe('GET /api/quizzes/:quizId/results/:attemptId', () => {
    it('should get detailed quiz results', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        creator: user._id,
        isPublished: true,
        settings: {
          showCorrectAnswers: true,
          showExplanations: true
        }
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
        explanation: 'This is the explanation',
        points: 10
      });

      // Create a completed attempt
      const attempt = await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        completedAt: new Date(),
        completed: true,
        answers: [
          {
            questionId: question._id,
            selectedOptionId: question.options[0]._id,
            isCorrect: true,
            points: 10,
            timeTaken: 20
          }
        ],
        score: 10,
        maxScore: 10,
        percentageScore: 100,
        passed: true
      });

      const response = await request(app)
        .get(`/api/quizzes/${quiz._id}/results/${attempt._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result.attemptId).toBe(attempt._id.toString());
      expect(response.body.data.result.quiz._id).toBe(quiz._id.toString());
      expect(response.body.data.result.user._id).toBe(user._id.toString());
      expect(response.body.data.result.totalScore).toBe(10);
      expect(response.body.data.result.maxPossibleScore).toBe(10);
      expect(response.body.data.result.percentageScore).toBe(100);
      expect(response.body.data.result.passed).toBe(true);
      expect(response.body.data.result.answers).toHaveLength(1);
      expect(response.body.data.result.answers[0].questionId).toBe(question._id.toString());
      expect(response.body.data.result.answers[0].isCorrect).toBe(true);
      expect(response.body.data.result.answers[0].timeTaken).toBe(20);
      expect(response.body.data.result.answers[0].explanation).toBe('This is the explanation');
    });

    it('should deny access to results for non-authorized user', async () => {
      const { user } = await createTestUser();
      const { accessToken: otherToken } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        creator: user._id,
        isPublished: true
      });

      // Create a completed attempt
      const attempt = await QuizAttempt.create({
        quiz: quiz._id,
        user: user._id,
        startedAt: new Date(Date.now() - 1000 * 60),
        completedAt: new Date(),
        completed: true
      });

      const response = await request(app)
        .get(`/api/quizzes/${quiz._id}/results/${attempt._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to access these results');
    });
  });
}); 