const mongoose = require('mongoose');
const shortid = require('shortid');

/**
 * LiveQuiz Schema
 * @type {mongoose.Schema}
 */
const LiveQuizSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionCode: {
    type: String,
    unique: true,
    default: () => shortid.generate()
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed'],
    default: 'waiting'
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      joinedAt: {
        type: Date,
        default: Date.now
      },
      score: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      },
      answers: [
        {
          questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
          },
          selectedOptionId: mongoose.Schema.Types.ObjectId,
          isCorrect: Boolean,
          timeTaken: Number,
          points: Number,
          answeredAt: Date
        }
      ]
    }
  ],
  currentQuestion: {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    startedAt: Date,
    endedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'active', 'ended'],
      default: 'pending'
    }
  },
  settings: {
    waitForHost: {
      type: Boolean,
      default: true
    },
    showLeaderboardAfterEachQuestion: {
      type: Boolean,
      default: true
    },
    allowLateJoin: {
      type: Boolean,
      default: true
    },
    lockAnswerSubmissionAfterTime: {
      type: Boolean,
      default: true
    },
    allowRetry: {
      type: Boolean,
      default: false
    },
    participantLimit: {
      type: Number,
      default: 100
    }
  },
  questionResults: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      correctAnswers: Number,
      incorrectAnswers: Number,
      averageResponseTime: Number,
      optionDistribution: [
        {
          optionId: mongoose.Schema.Types.ObjectId,
          count: Number,
          percentage: Number
        }
      ]
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Populate quiz and host on find
 */
LiveQuizSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'quiz',
    select: 'title description coverImage settings'
  }).populate({
    path: 'host',
    select: 'name'
  });
  
  next();
});

module.exports = mongoose.model('LiveQuiz', LiveQuizSchema); 