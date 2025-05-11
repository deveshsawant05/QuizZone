const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * @type {mongoose.Schema}
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.jpg'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshTokens: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for quizzes created
UserSchema.virtual('quizzes', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'creator',
  justOne: false
});

// Virtual for quiz attempts
UserSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

/**
 * Hash password before saving
 */
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Match password for authentication
 * @param {string} enteredPassword - Password to match
 * @returns {Promise<boolean>} - Whether the password matches
 */
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 