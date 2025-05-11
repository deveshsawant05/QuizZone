const mongoose = require('mongoose');
const shortid = require('shortid');

/**
 * Quiz Schema
 * @type {mongoose.Schema}
 */
const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String,
    default: 'default-quiz-cover.jpg'
  },
  type: {
    type: String,
    enum: ['static', 'live'],
    default: 'static'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  shareCode: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  settings: {
    timePerQuestion: {
      type: Number,
      default: 30 // in seconds
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    scoringMode: {
      type: String,
      enum: ['standard', 'time-based'],
      default: 'standard'
    },
    passingScore: {
      type: Number,
      default: 70 // percentage
    }
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for questions
QuizSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quizId',
  justOne: false,
  options: { sort: { order: 1 } }
});

// Virtual for attempts
QuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz',
  justOne: false
});

/**
 * Generate share code for quiz
 * @returns {string} - Generated share code
 */
QuizSchema.methods.generateShareCode = function() {
  this.shareCode = shortid.generate();
  return this.shareCode;
};

/**
 * Update timestamps before save
 */
QuizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema); 