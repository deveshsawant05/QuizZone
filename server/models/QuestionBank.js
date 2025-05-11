const mongoose = require('mongoose');

/**
 * QuestionBank Schema
 * @type {mongoose.Schema}
 */
const QuestionBankSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  usageCount: {
    type: Number,
    default: 0
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
QuestionBankSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('QuestionBank', QuestionBankSchema); 