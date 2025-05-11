const mongoose = require('mongoose');

/**
 * QuizAttempt Schema
 * @type {mongoose.Schema}
 */
const QuizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      selectedOptionId: mongoose.Schema.Types.ObjectId,
      timeTaken: Number, // in seconds
      isCorrect: Boolean,
      points: Number
    }
  ],
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 0
  },
  percentageScore: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  }
});

/**
 * Calculate score before saving
 */
QuizAttemptSchema.pre('save', async function(next) {
  if (this.completed && (!this.completedAt || this.isModified('completed'))) {
    this.completedAt = Date.now();
  }
  
  if (this.isModified('answers')) {
    let totalScore = 0;
    
    // Calculate total score from answers
    for (const answer of this.answers) {
      if (answer.isCorrect) {
        totalScore += answer.points;
      }
    }
    
    this.score = totalScore;
    
    // Calculate maxScore based on questions from the database
    if (this.answers.length > 0) {
      try {
        const Question = mongoose.model('Question');
        const questionIds = this.answers.map(answer => answer.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });
        
        // Sum up points from all questions
        const maxScore = questions.reduce((total, question) => total + question.points, 0);
        this.maxScore = maxScore;
      } catch (err) {
        console.error('Error calculating maxScore:', err);
        // Fallback if query fails - calculate from answers
        let maxScoreFromAnswers = 0;
        for (const answer of this.answers) {
          // Get the points value directly from the answer or use a default
          maxScoreFromAnswers += answer.points > 0 ? answer.points : 10; // Assume 10 points if not specified
        }
        this.maxScore = maxScoreFromAnswers;
      }
    }
    
    // Calculate percentage score
    this.percentageScore = this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 0;
    
    // Check if passed based on quiz passing score
    if (this.quiz && this.completed) {
      const quiz = await mongoose.model('Quiz').findById(this.quiz);
      this.passed = this.percentageScore >= quiz.settings.passingScore;
    }
  }
  
  next();
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema); 