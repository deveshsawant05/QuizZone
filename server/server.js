const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Import modules
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');
const logger = require('./utils/logger');

// Import route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const liveQuizRoutes = require('./routes/liveQuizRoutes');

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Initialize Express app
const app = express();

// Create HTTP server (for Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
const io = require('./config/socket')(server);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Set security headers
app.use(helmet());

// Rate limiting
app.use('/api', apiLimiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Passport initialization
app.use(passport.initialize());
require('./config/passport')(passport);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/live-quizzes', liveQuizRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    console.log(err.stack);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
}

module.exports = app; // Export for testing 