const mongoose = require('mongoose');

/**
 * Question Schema
 * @type {mongoose.Schema}
 */
const QuestionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: [true, 'Please provide a question'],
    trim: true,
    maxlength: [1000, 'Question cannot be more than 1000 characters']
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer', 'multiple_select'],
    default: 'multiple_choice'
  },
  image: {
    type: String
  },
  options: [
    {
      text: {
        type: String,
        required: function() {
          return this.questionType !== 'short_answer';
        }
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }
  ],
  explanation: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 10
  },
  timeLimit: {
    type: Number // in seconds
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Update timestamps before save
 */
QuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Question', QuestionSchema); 