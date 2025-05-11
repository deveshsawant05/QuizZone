const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB, createTestUser, app } = require('../setup');
const User = require('../../models/User');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');

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
});

describe('Question API Routes', () => {
  describe('POST /api/quizzes/:quizId/questions', () => {
    it('should create a new question', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz first
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      const questionData = {
        questionText: 'What is the capital of France?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Paris', isCorrect: true },
          { text: 'London', isCorrect: false },
          { text: 'Berlin', isCorrect: false },
          { text: 'Madrid', isCorrect: false }
        ],
        explanation: 'Paris is the capital of France',
        points: 10
      };

      const response = await request(app)
        .post(`/api/quizzes/${quiz._id}/questions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question).toHaveProperty('_id');
      expect(response.body.data.question.questionText).toBe(questionData.questionText);
      expect(response.body.data.question.options).toHaveLength(4);

      // Verify question was created in DB
      const question = await Question.findById(response.body.data.question._id);
      expect(question).not.toBeNull();
      expect(question.quizId.toString()).toBe(quiz._id.toString());
    });

    it('should return error if not authenticated', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      const questionData = {
        questionText: 'What is the capital of France?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Paris', isCorrect: true },
          { text: 'London', isCorrect: false }
        ]
      };

      const response = await request(app)
        .post(`/api/quizzes/${quiz._id}/questions`)
        .send(questionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/quizzes/:quizId/questions', () => {
    it('should get all questions for a quiz', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      // Create some questions
      await Question.create([
        {
          quizId: quiz._id,
          questionText: 'Question 1',
          questionType: 'multiple_choice',
          options: [
            { text: 'Option 1', isCorrect: true },
            { text: 'Option 2', isCorrect: false }
          ],
          order: 1
        },
        {
          quizId: quiz._id,
          questionText: 'Question 2',
          questionType: 'multiple_choice',
          options: [
            { text: 'Option 1', isCorrect: false },
            { text: 'Option 2', isCorrect: true }
          ],
          order: 2
        }
      ]);

      const response = await request(app)
        .get(`/api/quizzes/${quiz._id}/questions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(2);
      expect(response.body.data.questions[0].questionText).toBe('Question 1');
      expect(response.body.data.questions[1].questionText).toBe('Question 2');
    });
  });

  describe('GET /api/quizzes/:quizId/questions/:id', () => {
    it('should get a question by ID', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      // Create a question
      const question = await Question.create({
        quizId: quiz._id,
        questionText: 'What is the capital of France?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Paris', isCorrect: true },
          { text: 'London', isCorrect: false }
        ]
      });

      const response = await request(app)
        .get(`/api/quizzes/${quiz._id}/questions/${question._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question._id).toBe(question._id.toString());
      expect(response.body.data.question.questionText).toBe(question.questionText);
    });

    it('should return error for non-existent question', async () => {
      const { user, accessToken } = await createTestUser();
      
      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/quizzes/${quiz._id}/questions/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(`Question not found with id of ${nonExistentId}`);
    });
  });

  describe('PUT /api/quizzes/:quizId/questions/:id', () => {
    it('should update a question', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      // Create a question
      const question = await Question.create({
        quizId: quiz._id,
        questionText: 'Original question?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ]
      });

      const updateData = {
        questionText: 'Updated question?',
        options: [
          { text: 'New Option 1', isCorrect: false },
          { text: 'New Option 2', isCorrect: true },
          { text: 'New Option 3', isCorrect: false }
        ]
      };

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}/questions/${question._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question.questionText).toBe(updateData.questionText);
      expect(response.body.data.question.options).toHaveLength(3);

      // Verify DB was updated
      const updatedQuestion = await Question.findById(question._id);
      expect(updatedQuestion.questionText).toBe(updateData.questionText);
      expect(updatedQuestion.options).toHaveLength(3);
    });

    it('should deny update for non-creator', async () => {
      const { user } = await createTestUser();
      const { accessToken: otherToken } = await createTestUser({
        name: 'Other User',
        email: 'other@example.com'
      });

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      // Create a question
      const question = await Question.create({
        quizId: quiz._id,
        questionText: 'Original question?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ]
      });

      const updateData = {
        questionText: 'Updated question?'
      };

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}/questions/${question._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to update this question');
    });
  });

  describe('DELETE /api/quizzes/:quizId/questions/:id', () => {
    it('should delete a question', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      // Create a question
      const question = await Question.create({
        quizId: quiz._id,
        questionText: 'What is the capital of France?',
        questionType: 'multiple_choice',
        options: [
          { text: 'Paris', isCorrect: true },
          { text: 'London', isCorrect: false }
        ]
      });

      const response = await request(app)
        .delete(`/api/quizzes/${quiz._id}/questions/${question._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify question was deleted
      const deletedQuestion = await Question.findById(question._id);
      expect(deletedQuestion).toBeNull();
    });
  });

  describe('PUT /api/quizzes/:quizId/questions/reorder', () => {
    it('should reorder questions', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a quiz
      const quiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'Test quiz description',
        creator: user._id
      });

      // Create questions
      const question1 = await Question.create({
        quizId: quiz._id,
        questionText: 'Question 1',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false }
        ],
        order: 1
      });

      const question2 = await Question.create({
        quizId: quiz._id,
        questionText: 'Question 2',
        questionType: 'multiple_choice',
        options: [
          { text: 'Option 1', isCorrect: false },
          { text: 'Option 2', isCorrect: true }
        ],
        order: 2
      });

      const reorderData = {
        questions: [
          { id: question2._id, order: 1 },
          { id: question1._id, order: 2 }
        ]
      };

      const response = await request(app)
        .put(`/api/quizzes/${quiz._id}/questions/reorder`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reorderData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify DB was updated
      const updatedQuestion1 = await Question.findById(question1._id);
      const updatedQuestion2 = await Question.findById(question2._id);
      expect(updatedQuestion1.order).toBe(2);
      expect(updatedQuestion2.order).toBe(1);
    });
  });
}); 