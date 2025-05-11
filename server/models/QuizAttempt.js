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
    let maxScore = 0;
    
    for (const answer of this.answers) {
      if (answer.isCorrect) {
        totalScore += answer.points;
      }
      maxScore += answer.points;
    }
    
    this.score = totalScore;
    this.maxScore = maxScore;
    this.percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    // Check if passed based on quiz passing score
    if (this.quiz && this.completed) {
      const quiz = await mongoose.model('Quiz').findById(this.quiz);
      this.passed = this.percentageScore >= quiz.settings.passingScore;
    }
  }
  
  next();
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema); 