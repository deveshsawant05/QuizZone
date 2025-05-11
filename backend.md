# Backend Documentation

## Overview

The backend system for the Quiz Application is built using Express.js, Node.js, and MongoDB. It implements RESTful APIs for static content and WebSockets for real-time interactions. This document provides detailed specifications for all API endpoints, WebSocket events, database interactions, and security implementations.

## Technology Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **Socket.IO**: WebSocket implementation
- **JWT**: Authentication mechanism
- **bcrypt**: Password hashing
- **cors**: Cross-Origin Resource Sharing
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting

## Project Structure

```
backend/
├── config/
│   ├── db.js              # Database connection
│   ├── socket.js          # Socket.IO configuration
│   └── passport.js        # JWT strategy configuration
├── controllers/
│   ├── authController.js
│   ├── quizController.js
│   ├── liveQuizController.js
│   ├── questionController.js
│   └── userController.js
├── middleware/
│   ├── auth.js            # JWT verification middleware
│   ├── errorHandler.js    # Global error handling
│   ├── rateLimiter.js     # API rate limiting
│   └── validator.js       # Request validation
├── models/
│   ├── User.js
│   ├── Quiz.js
│   ├── Question.js
│   ├── QuizAttempt.js
│   └── LiveRoom.js
├── routes/
│   ├── authRoutes.js
│   ├── quizRoutes.js
│   ├── liveQuizRoutes.js
│   ├── questionRoutes.js
│   └── userRoutes.js
├── services/
│   ├── authService.js
│   ├── quizService.js
│   ├── liveQuizService.js
│   └── aiService.js       # Optional AI integration
├── sockets/
│   ├── handlers/
│   │   ├── liveQuizHandler.js
│   │   ├── participantHandler.js
│   │   └── hostHandler.js
│   └── socketManager.js
├── utils/
│   ├── tokenUtils.js      # JWT utilities
│   ├── responseUtils.js   # Standardized API responses
│   └── validationSchemas.js
├── app.js                 # Express application setup
└── server.js              # Entry point
```

## Authentication Implementation

### JWT Configuration

```javascript
// config/passport.js
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

module.exports = (passport) => {
  passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id).select('-password');
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }));
};
```

### Authentication Middleware

```javascript
// middleware/auth.js
const passport = require('passport');

exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Please login.'
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access forbidden. Admin privileges required.'
    });
  }
};
```

### Token Utilities

```javascript
// utils/tokenUtils.js
const jwt = require('jsonwebtoken');

exports.generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};
```

## API Specifications

### Authentication APIs

#### Register User

- **Endpoint**: `POST /api/auth/register`
- **Authentication**: None
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "user": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```
- **Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Email already in use",
    "errors": {
      "email": "Email is already registered"
    }
  }
  ```

#### Login User

- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None
- **Description**: Authenticate user and get tokens
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

#### Logout User

- **Endpoint**: `POST /api/auth/logout`
- **Authentication**: Required
- **Description**: Invalidate refresh token
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### Refresh Token

- **Endpoint**: `POST /api/auth/refresh-token`
- **Authentication**: None
- **Description**: Get new access token using refresh token
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Invalid or expired refresh token"
  }
  ```

#### Forgot Password

- **Endpoint**: `POST /api/auth/forgot-password`
- **Authentication**: None
- **Description**: Send password reset email
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password reset link sent to your email"
  }
  ```

#### Reset Password

- **Endpoint**: `POST /api/auth/reset-password`
- **Authentication**: None
- **Description**: Reset password using token
- **Request Body**:
  ```json
  {
    "token": "reset-token-from-email",
    "password": "newSecurePassword123",
    "confirmPassword": "newSecurePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully"
  }
  ```

#### Get User Profile

- **Endpoint**: `GET /api/auth/profile`
- **Authentication**: Required
- **Description**: Get current user profile
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "email": "john@example.com",
        "profilePicture": "https://example.com/avatar.jpg",
        "createdAt": "2023-05-10T15:30:45.123Z"
      }
    }
  }
  ```

#### Update User Profile

- **Endpoint**: `PUT /api/auth/profile`
- **Authentication**: Required
- **Description**: Update user profile
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "name": "John Updated",
    "profilePicture": "https://example.com/new-avatar.jpg"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "user": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "John Updated",
        "email": "john@example.com",
        "profilePicture": "https://example.com/new-avatar.jpg"
      }
    }
  }
  ```

### Quiz Management APIs

#### Create Quiz

- **Endpoint**: `POST /api/quizzes`
- **Authentication**: Required
- **Description**: Create a new quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "title": "Web Development Basics",
    "description": "Test your knowledge of web development fundamentals",
    "coverImage": "https://example.com/cover.jpg",
    "type": "static",
    "settings": {
      "timePerQuestion": 30,
      "randomizeQuestions": true,
      "showCorrectAnswers": true,
      "showExplanations": true,
      "scoringMode": "standard",
      "passingScore": 70
    },
    "tags": ["web", "development", "html", "css"]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Quiz created successfully",
    "data": {
      "quiz": {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Web Development Basics",
        "description": "Test your knowledge of web development fundamentals",
        "coverImage": "https://example.com/cover.jpg",
        "creator": "60d21b4667d0d8992e610c85",
        "type": "static",
        "isPublished": false,
        "settings": {
          "timePerQuestion": 30,
          "randomizeQuestions": true,
          "showCorrectAnswers": true,
          "showExplanations": true,
          "scoringMode": "standard",
          "passingScore": 70
        },
        "questions": [],
        "tags": ["web", "development", "html", "css"],
        "createdAt": "2023-05-10T15:30:45.123Z",
        "updatedAt": "2023-05-10T15:30:45.123Z"
      }
    }
  }
  ```

#### Get All Quizzes (by current user)

- **Endpoint**: `GET /api/quizzes`
- **Authentication**: Required
- **Description**: Get all quizzes created by the current user
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `type`: Filter by quiz type (optional)
  - `search`: Search in title/description (optional)
  - `isPublished`: Filter by published status (optional)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "quizzes": [
        {
          "_id": "60d21b4667d0d8992e610c86",
          "title": "Web Development Basics",
          "description": "Test your knowledge of web development fundamentals",
          "coverImage": "https://example.com/cover.jpg",
          "type": "static",
          "isPublished": true,
          "shareCode": "abc123xyz",
          "questionCount": 10,
          "attemptCount": 25,
          "averageScore": 78.5,
          "createdAt": "2023-05-10T15:30:45.123Z"
        },
        {
          "_id": "60d21b4667d0d8992e610c87",
          "title": "JavaScript Fundamentals",
          "description": "Test your JavaScript knowledge",
          "coverImage": "https://example.com/js-cover.jpg",
          "type": "live",
          "isPublished": false,
          "questionCount": 5,
          "attemptCount": 0,
          "createdAt": "2023-05-11T10:20:30.123Z"
        }
      ],
      "pagination": {
        "total": 2,
        "page": 1,
        "limit": 10,
        "pages": 1
      }
    }
  }
  ```

#### Get Quiz Details

- **Endpoint**: `GET /api/quizzes/:quizId`
- **Authentication**: Required
- **Description**: Get detailed information about a specific quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "quiz": {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Web Development Basics",
        "description": "Test your knowledge of web development fundamentals",
        "coverImage": "https://example.com/cover.jpg",
        "creator": {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "John Doe"
        },
        "type": "static",
        "isPublished": true,
        "shareCode": "abc123xyz",
        "settings": {
          "timePerQuestion": 30,
          "randomizeQuestions": true,
          "showCorrectAnswers": true,
          "showExplanations": true,
          "scoringMode": "standard",
          "passingScore": 70
        },
        "questions": [
          {
            "_id": "60d21b4667d0d8992e610c88",
            "questionText": "What does HTML stand for?",
            "questionType": "multiple_choice",
            "options": [
              {
                "_id": "60d21b4667d0d8992e610c8a",
                "text": "Hyper Text Markup Language",
                "isCorrect": true
              },
              {
                "_id": "60d21b4667d0d8992e610c8b",
                "text": "High Tech Multi Language",
                "isCorrect": false
              },
              {
                "_id": "60d21b4667d0d8992e610c8c",
                "text": "Hyper Transfer Markup Language",
                "isCorrect": false
              },
              {
                "_id": "60d21b4667d0d8992e610c8d",
                "text": "Hyperlink Text Management Language",
                "isCorrect": false
              }
            ],
            "explanation": "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.",
            "points": 10,
            "order": 1
          }
          // ... more questions
        ],
        "tags": ["web", "development", "html", "css"],
        "createdAt": "2023-05-10T15:30:45.123Z",
        "updatedAt": "2023-05-10T16:45:12.456Z"
      }
    }
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Quiz not found"
  }
  ```

#### Update Quiz

- **Endpoint**: `PUT /api/quizzes/:quizId`
- **Authentication**: Required
- **Description**: Update quiz details
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "title": "Web Development Fundamentals",
    "description": "Updated description for web development quiz",
    "settings": {
      "timePerQuestion": 45,
      "showCorrectAnswers": false
    },
    "tags": ["web", "development", "html", "css", "javascript"]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz updated successfully",
    "data": {
      "quiz": {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Web Development Fundamentals",
        "description": "Updated description for web development quiz",
        "settings": {
          "timePerQuestion": 45,
          "randomizeQuestions": true,
          "showCorrectAnswers": false,
          "showExplanations": true,
          "scoringMode": "standard",
          "passingScore": 70
        },
        "tags": ["web", "development", "html", "css", "javascript"],
        "updatedAt": "2023-05-10T17:20:30.789Z"
      }
    }
  }
  ```

#### Delete Quiz

- **Endpoint**: `DELETE /api/quizzes/:quizId`
- **Authentication**: Required
- **Description**: Delete a quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz deleted successfully"
  }
  ```

#### Add Question to Quiz

- **Endpoint**: `POST /api/quizzes/:quizId/questions`
- **Authentication**: Required
- **Description**: Add a new question to a quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "questionText": "Which CSS property is used to change the text color?",
    "questionType": "multiple_choice",
    "image": "https://example.com/css-colors.jpg",
    "options": [
      {
        "text": "color",
        "isCorrect": true
      },
      {
        "text": "text-color",
        "isCorrect": false
      },
      {
        "text": "font-color",
        "isCorrect": false
      },
      {
        "text": "foreground-color",
        "isCorrect": false
      }
    ],
    "explanation": "The CSS 'color' property is used to set the color of text.",
    "points": 10,
    "timeLimit": 30,
    "order": 2
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Question added successfully",
    "data": {
      "question": {
        "_id": "60d21b4667d0d8992e610c89",
        "quizId": "60d21b4667d0d8992e610c86",
        "questionText": "Which CSS property is used to change the text color?",
        "questionType": "multiple_choice",
        "image": "https://example.com/css-colors.jpg",
        "options": [
          {
            "_id": "60d21b4667d0d8992e610c8e",
            "text": "color",
            "isCorrect": true
          },
          {
            "_id": "60d21b4667d0d8992e610c8f",
            "text": "text-color",
            "isCorrect": false
          },
          {
            "_id": "60d21b4667d0d8992e610c90",
            "text": "font-color",
            "isCorrect": false
          },
          {
            "_id": "60d21b4667d0d8992e610c91",
            "text": "foreground-color",
            "isCorrect": false
          }
        ],
        "explanation": "The CSS 'color' property is used to set the color of text.",
        "points": 10,
        "timeLimit": 30,
        "order": 2,
        "createdAt": "2023-05-10T18:15:22.123Z"
      }
    }
  }
  ```

#### Update Question

- **Endpoint**: `PUT /api/quizzes/:quizId/questions/:questionId`
- **Authentication**: Required
- **Description**: Update a question in a quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "questionText": "Which CSS property is used to change the text color of an element?",
    "options": [
      {
        "_id": "60d21b4667d0d8992e610c8e",
        "text": "color",
        "isCorrect": true
      },
      {
        "_id": "60d21b4667d0d8992e610c8f",
        "text": "text-color",
        "isCorrect": false
      },
      {
        "_id": "60d21b4667d0d8992e610c90",
        "text": "font-color",
        "isCorrect": false
      },
      {
        "_id": "60d21b4667d0d8992e610c91",
        "text": "text-style",
        "isCorrect": false
      }
    ],
    "points": 15
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Question updated successfully",
    "data": {
      "question": {
        "_id": "60d21b4667d0d8992e610c89",
        "questionText": "Which CSS property is used to change the text color of an element?",
        "options": [
          {
            "_id": "60d21b4667d0d8992e610c8e",
            "text": "color",
            "isCorrect": true
          },
          {
            "_id": "60d21b4667d0d8992e610c8f",
            "text": "text-color",
            "isCorrect": false
          },
          {
            "_id": "60d21b4667d0d8992e610c90",
            "text": "font-color",
            "isCorrect": false
          },
          {
            "_id": "60d21b4667d0d8992e610c91",
            "text": "text-style",
            "isCorrect": false
          }
        ],
        "points": 15,
        "updatedAt": "2023-05-10T19:05:12.456Z"
      }
    }
  }
  ```

#### Delete Question

- **Endpoint**: `DELETE /api/quizzes/:quizId/questions/:questionId`
- **Authentication**: Required
- **Description**: Delete a question from a quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Question deleted successfully"
  }
  ```

#### Publish Quiz

- **Endpoint**: `POST /api/quizzes/:quizId/publish`
- **Authentication**: Required
- **Description**: Publish a quiz and generate share code
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz published successfully",
    "data": {
      "shareCode": "abc123xyz",
      "shareUrl": "https://quizapp.com/quiz/abc123xyz"
    }
  }
  ```

#### Access Shared Quiz

- **Endpoint**: `GET /api/quizzes/shared/:shareCode`
- **Authentication**: Required
- **Description**: Access a quiz using share code
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "quiz": {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Web Development Fundamentals",
        "description": "Test your knowledge of web development fundamentals",
        "coverImage": "https://example.com/cover.jpg",
        "creator": {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "John Doe"
        },
        "type": "static",
        "settings": {
          "timePerQuestion": 45,
          "randomizeQuestions": true,
          "showCorrectAnswers": false,
          "showExplanations": true,
          "scoringMode": "standard",
          "passingScore": 70
        }
      },
      "questions": [
        {
          "_id": "60d21b4667d0d8992e610c88",
          "questionText": "What does HTML stand for?",
          "questionType": "multiple_choice",
          "image": null,
          "options": [
            {
              "_id": "60d21b4667d0d8992e610c8a",
              "text": "Hyper Text Markup Language"
            },
            {
              "_id": "60d21b4667d0d8992e610c8b",
              "text": "High Tech Multi Language"
            },
            {
              "_id": "60d21b4667d0d8992e610c8c",
              "text": "Hyper Transfer Markup Language"
            },
            {
              "_id": "60d21b4667d0d8992e610c8d",
              "text": "Hyperlink Text Management Language"
            }
          ],
          "points": 10,
          "timeLimit": 30,
          "order": 1
        }
        // ... more questions
      ]
    }
  }
  ```

#### Start Quiz Attempt

- **Endpoint**: `POST /api/quizzes/:quizId/attempt`
- **Authentication**: Required
- **Description**: Start a new quiz attempt
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "attemptId": "60d21b4667d0d8992e610c92",
      "startedAt": "2023-05-10T20:30:45.123Z"
    }
  }
  ```

#### Submit Quiz Answers

- **Endpoint**: `POST /api/quizzes/:quizId/submit`
- **Authentication**: Required
- **Description**: Submit answers for a quiz attempt
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "attemptId": "60d21b4667d0d8992e610c92",
    "answers": [
      {
        "questionId": "60d21b4667d0d8992e610c88",
        "selectedOptionId": "60d21b4667d0d8992e610c8a",
        "timeTaken": 15
      },
      {
        "questionId": "60d21b4667d0d8992e610c89",
        "selectedOptionId": "60d21b4667d0d8992e610c8e",
        "timeTaken": 20
      }
      // ... more answers
    ]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz submitted successfully",
    "data": {
      "result": {
        "attemptId": "60d21b4667d0d8992e610c92",
        "totalScore": 25,
        "maxPossibleScore": 25,
        "percentageScore": 100,
        "passed": true,
        "completedAt": "2023-05-10T20:35:15.456Z",
        "timeTaken": "4m 30s",
        "answers": [
          {
            "questionId": "60d21b4667d0d8992e610c88",
            "isCorrect": true,
            "points": 10,
            "correctOption": {
              "_id": "60d21b4667d0d8992e610c8a",
              "text": "Hyper Text Markup Language"
            },
            "selectedOption": {
              "_id": "60d21b4667d0d8992e610c8a",
              "text": "Hyper Text Markup Language"
            },
            "explanation": "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
          },
          {
            "questionId": "60d21b4667d0d8992e610c89",
            "isCorrect": true,
            "points": 15,
            "correctOption": {
              "_id": "60d21b4667d0d8992e610c8e",
              "text": "color"
            },
            "selectedOption": {
              "_id": "60d21b4667d0d8992e610c8e",
              "text": "color"
            },
            "explanation": "The CSS 'color' property is used to set the color of text."
          }
          // ... more answers
        ]
      }
    }
  }
  ```

#### Get Quiz Results

- **Endpoint**: `GET /api/quizzes/:quizId/results/:attemptId`
- **Authentication**: Required
- **Description**: Get detailed results for a completed quiz attempt
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "result": {
        "attemptId": "60d21b4667d0d8992e610c92",
        "user": {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "John Doe"
        },
        "quiz": {
          "_id": "60d21b4667d0d8992e610c86",
          "title": "Web Development Fundamentals"
        },
        "totalScore": 25,
        "maxPossibleScore": 25,
        "percentageScore": 100,
        "passed": true,
        "startedAt": "2023-05-10T20:30:45.123Z",
        "completedAt": "2023-05-10T20:35:15.456Z",
        "timeTaken": "4m 30s",
        "answers": [
          {
            "questionId": "60d21b4667d0d8992e610c88",
            "questionText": "What does HTML stand for?",
            "questionType": "multiple_choice",
            "isCorrect": true,
            "points": 10,
            "timeTaken": 15,
            "correctOption": {
              "_id": "60d21b4667d0d8992e610c8a",
              "text": "Hyper Text Markup Language"
            },
            "selectedOption": {
              "_id": "60d21b4667d0d8992e610c8a",
              "text": "Hyper Text Markup Language"
            },
            "allOptions": [
              {
                "_id": "60d21b4667d0d8992e610c8a",
                "text": "Hyper Text Markup Language",
                "isCorrect": true
              },
              {
                "_id": "60d21b4667d0d8992e610c8b",
                "text": "High Tech Multi Language",
                "isCorrect": false
              },
              {
                "_id": "60d21b4667d0d8992e610c8c",
                "text": "Hyper Transfer Markup Language",
                "isCorrect": false
              },
              {
                "_id": "60d21b4667d0d8992e610c8d",
                "text": "Hyperlink Text Management Language",
                "isCorrect": false
              }
            ],
            "explanation": "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
          }
          // ... more answers
        ]
      }
    }
  }
  ```

### Live Quiz APIs

#### Create Live Quiz Room

- **Endpoint**: `POST /api/live-quizzes`
- **Authentication**: Required
- **Description**: Create a live quiz room from an existing quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Request Body**:
  ```json
  {
    "quizId": "60d21b4667d0d8992e610c86",
    "settings": {
      "waitForHost": true,
      "showLeaderboardAfterEachQuestion": true,
      "allowLateJoin": true,
      "lockAnswerSubmissionAfterTime": true,
      "allowRetry": false,
      "participantLimit": 100
    }
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Live quiz room created successfully",
    "data": {
      "roomId": "web-dev-123",
      "roomCode": "XYZABC",
      "hostUrl": "https://quizapp.com/live-quiz/web-dev-123/host",
      "joinUrl": "https://quizapp.com/live-quiz/join?code=XYZABC"
    }
  }
  ```

#### Validate Live Quiz Room

- **Endpoint**: `GET /api/live-quizzes/:roomId`
- **Authentication**: Required
- **Description**: Validate a live quiz room and get basic info
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "roomId": "web-dev-123",
      "roomCode": "XYZABC",
      "quiz": {
        "title": "Web Development Fundamentals",
        "description": "Test your knowledge of web development fundamentals",
        "coverImage": "https://example.com/cover.jpg"
      },
      "host": {
        "name": "John Doe"
      },
      "status": "waiting",
      "participantCount": 12,
      "settings": {
        "waitForHost": true,
        "showLeaderboardAfterEachQuestion": true,
        "allowLateJoin": true
      }
    }
  }
  ```

#### Get Room by Code

- **Endpoint**: `GET /api/live-quizzes/code/:roomCode`
- **Authentication**: Required
- **Description**: Get live quiz room by room code
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "roomId": "web-dev-123",
      "roomCode": "XYZABC",
      "quiz": {
        "title": "Web Development Fundamentals"
      },
      "host": {
        "name": "John Doe"
      },
      "status": "waiting"
    }
  }
  ```

#### Start Live Quiz

- **Endpoint**: `POST /api/live-quizzes/:roomId/start`
- **Authentication**: Required
- **Description**: Start a live quiz (host only)
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz started successfully"
  }
  ```

#### End Live Quiz

- **Endpoint**: `POST /api/live-quizzes/:roomId/end`
- **Authentication**: Required
- **Description**: End a live quiz (host only)
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quiz ended successfully"
  }
  ```

#### Get Live Quiz Results

- **Endpoint**: `GET /api/live-quizzes/:roomId/results`
- **Authentication**: Required
- **Description**: Get final results of a live quiz
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "quiz": {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Web Development Fundamentals"
      },
      "participants": [
        {
          "userId": "60d21b4667d0d8992e610c85",
          "name": "John Doe",
          "score": 95,
          "rank": 1,
          "answersCorrect": 9,
          "totalQuestions": 10,
          "averageResponseTime": 12.5
        },
        {
          "userId": "60d21b4667d0d8992e610c95",
          "name": "Jane Smith",
          "score": 85,
          "rank": 2,
          "answersCorrect": 8,
          "totalQuestions": 10,
          "averageResponseTime": 15.2
        }
        // ... more participants
      ],
      "questions": [
        {
          "questionId": "60d21b4667d0d8992e610c88",
          "questionText": "What does HTML stand for?",
          "statistics": {
            "correctAnswers": 10,
            "incorrectAnswers": 2,
            "averageResponseTime": 14.3,
            "optionDistribution": [
              {
                "optionId": "60d21b4667d0d8992e610c8a",
                "text": "Hyper Text Markup Language",
                "count": 10,
                "percentage": 83.3
              },
              {
                "optionId": "60d21b4667d0d8992e610c8b",
                "text": "High Tech Multi Language",
                "count": 1,
                "percentage": 8.3
              },
              {
                "optionId": "60d21b4667d0d8992e610c8c",
                "text": "Hyper Transfer Markup Language",
                "count": 1,
                "percentage": 8.3
              },
              {
                "optionId": "60d21b4667d0d8992e610c8d",
                "text": "Hyperlink Text Management Language",
                "count": 0,
                "percentage": 0
              }
            ]
          }
        }
        // ... more questions
      ]
    }
  }
  ```

### User & Attempt APIs

#### Get User Attempts

- **Endpoint**: `GET /api/users/me/attempts`
- **Authentication**: Required
- **Description**: Get all quiz attempts by the current user
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort by field (default: createdAt)
  - `order`: Sort order (default: desc)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "attempts": [
        {
          "_id": "60d21b4667d0d8992e610c92",
          "quiz": {
            "_id": "60d21b4667d0d8992e610c86",
            "title": "Web Development Fundamentals"
          },
          "score": 25,
          "maxScore": 25,
          "percentageScore": 100,
          "passed": true,
          "completed": true,
          "startedAt": "2023-05-10T20:30:45.123Z",
          "completedAt": "2023-05-10T20:35:15.456Z"
        },
        {
          "_id": "60d21b4667d0d8992e610c96",
          "quiz": {
            "_id": "60d21b4667d0d8992e610c87",
            "title": "JavaScript Fundamentals"
          },
          "score": 18,
          "maxScore": 20,
          "percentageScore": 90,
          "passed": true,
          "completed": true,
          "startedAt": "2023-05-11T10:15:30.123Z",
          "completedAt": "2023-05-11T10:20:45.456Z"
        }
        // ... more attempts
      ],
      "pagination": {
        "total": 2,
        "page": 1,
        "limit": 10,
        "pages": 1
      }
    }
  }
  ```

#### Get User Statistics

- **Endpoint**: `GET /api/users/me/statistics`
- **Authentication**: Required
- **Description**: Get user's quiz statistics and analytics
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalQuizzesTaken": 15,
        "totalQuizzesCreated": 5,
        "averageScore": 85.6,
        "totalTimePlayed": "5h 23m",
        "favoriteTags": ["javascript", "web", "css"]
      },
      "quizzesTaken": {
        "completed": 15,
        "inProgress": 2,
        "passed": 13,
        "failed": 2
      },
      "quizzesCreated": {
        "total": 5,
        "published": 3,
        "drafts": 2,
        "totalAttempts": 120,
        "averageScore": 78.3
      },
      "performance": {
        "monthly": [
          {
            "month": "January",
            "quizzesTaken": 3,
            "averageScore": 82.1
          },
          {
            "month": "February",
            "quizzesTaken": 5,
            "averageScore": 85.7
          }
          // ... more months
        ],
        "byTags": [
          {
            "tag": "javascript",
            "attemptCount": 8,
            "averageScore": 88.2
          },
          {
            "tag": "css",
            "attemptCount": 4,
            "averageScore": 90.5
          }
          // ... more tags
        ]
      }
    }
  }
  ```

#### Get Question Bank

- **Endpoint**: `GET /api/questions`
- **Authentication**: Required
- **Description**: Get questions from the user's question bank
- **Request Headers**:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `tags`: Filter by tags (comma-separated)
  - `type`: Filter by question type
  - `difficulty`: Filter by difficulty
  - `search`: Search in question text
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "questions": [
        {
          "_id": "60d21b4667d0d8992e610c88",
          "questionText": "What does HTML stand for?",
          "questionType": "multiple_choice",
          "tags": ["html", "web"],
          "difficulty": "easy",
          "usageCount": 5,
          "createdAt": "2023-05-10T15:30:45.123Z"
        },
        {
          "_id": "60d21b4667d0d8992e610c89",
          "questionText": "Which CSS property is used to change the text color of an element?",
          "questionType": "multiple_choice",
          "tags": ["css", "web"],
          "difficulty": "easy",
          "usageCount": 3,
          "createdAt": "2023-05-10T15:35:20.456Z"
        }
        // ... more questions
      ],
      "pagination": {
        "total": 45,
        "page": 1,
        "limit": 20,
        "pages": 3
      }
    }
  }
  ```

## WebSocket API

### Socket.IO Configuration

```javascript
// config/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { liveQuizHandler } = require('../sockets/handlers/liveQuizHandler');
const { participantHandler } = require('../sockets/handlers/participantHandler');
const { hostHandler } = require('../sockets/handlers/hostHandler');

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Live quiz namespace
  const liveQuiz = io.of('/live-quiz');
  
  liveQuiz.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Set up event handlers
    liveQuizHandler(socket, liveQuiz);
    participantHandler(socket, liveQuiz);
    hostHandler(socket, liveQuiz);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};
```

### WebSocket Events

#### Room Management Events

- **join:room** (client → server)
  - **Data**: `{ roomCode: "XYZABC", name: "John Doe" }`
  - **Description**: Join a live quiz room
  - **Response**: 
    - **user:joined** (server → client, broadcast)
      - **Data**: `{ userId: "60d21b4667d0d8992e610c85", name: "John Doe" }`

- **leave:room** (client → server)
  - **Data**: `{ roomCode: "XYZABC" }`
  - **Description**: Leave a live quiz room
  - **Response**: 
    - **user:left** (server → client, broadcast)
      - **Data**: `{ userId: "60d21b4667d0d8992e610c85", name: "John Doe" }`

#### Host Events

- **host:start-quiz** (client → server)
  - **Data**: `{ roomId: "web-dev-123" }`
  - **Description**: Start the quiz (host only)
  - **Response**: 
    - **quiz:start** (server → client, broadcast)
      - **Data**: `{ quizId: "60d21b4667d0d8992e610c86", totalQuestions: 10 }`

- **host:next-question** (client → server)
  - **Data**: `{ roomId: "web-dev-123" }`
  - **Description**: Move to next question (host only)
  - **Response**: 
    - **quiz:question** (server → client, broadcast)
      - **Data**: 
        ```json
        {
          "questionId": "60d21b4667d0d8992e610c88",
          "questionText": "What does HTML stand for?",
          "questionType": "multiple_choice",
          "options": [
            {
              "_id": "60d21b4667d0d8992e610c8a",
              "text": "Hyper Text Markup Language"
            },
            {
              "_id": "60d21b4667d0d8992e610c8b",
              "text": "High Tech Multi Language"
            },
            {
              "_id": "60d21b4667d0d8992e610c8c",
              "text": "Hyper Transfer Markup Language"
            },
            {
              "_id": "60d21b4667d0d8992e610c8d",
              "text": "Hyperlink Text Management Language"
            }
          ],
          "timeLimit": 30,
          "questionNumber": 1
        }
        ```
    - **quiz:timer** (server → client, broadcast, recurring)
      - **Data**: `{ questionId: "60d21b4667d0d8992e610c88", remainingTime: 30, totalTime: 30 }`

- **host:pause-quiz** (client → server)
  - **Data**: `{ roomId: "web-dev-123" }`
  - **Description**: Pause the current quiz (host only)
  - **Response**: 
    - **quiz:paused** (server → client, broadcast)
      - **Data**: `{ remainingTime: 15 }`

- **host:resume-quiz** (client → server)
  - **Data**: `{ roomId: "web-dev-123" }`
  - **Description**: Resume the current quiz (host only)
  - **Response**: 
    - **quiz:resumed** (server → client, broadcast)
      - **Data**: `{ remainingTime: 15 }`

- **host:end-quiz** (client → server)
  - **Data**: `{ roomId: "web-dev-123" }`
  - **Description**: End the quiz early (host only)
  - **Response**: 
    - **quiz:end** (server → client, broadcast)
      - **Data**: Final results object (same as GET /api/live-quizzes/:roomId/results)

#### Participant Events

- **submit:answer** (client → server)
  - **Data**: 
    ```json
    {
      "roomId": "web-dev-123",
      "questionId": "60d21b4667d0d8992e610c88",
      "answerId": "60d21b4667d0d8992e610c8a",
      "timeTaken": 12
    }
    ```
  - **Description**: Submit answer for current question
  - **Response**: 
    - **answer:received** (server → client)
      - **Data**: `{ received: true, questionId: "60d21b4667d0d8992e610c88" }`

- **ready:status** (client → server)
  - **Data**: `{ roomId: "web-dev-123", ready: true }`
  - **Description**: Set participant ready status
  - **Response**: 
    - **participant:status** (server → client, broadcast)
      - **Data**: `{ userId: "60d21b4667d0d8992e610c85", name: "John Doe", ready: true }`

#### Quiz Flow Events

- **quiz:question-end** (server → client, broadcast)
  - **Data**: 
    ```json
    {
      "questionId": "60d21b4667d0d8992e610c88",
      "correctAnswerId": "60d21b4667d0d8992e610c8a",
      "statistics": {
        "correctAnswers": 10,
        "incorrectAnswers": 2,
        "averageResponseTime": 14.3,
        "optionDistribution": [
          {
            "optionId": "60d21b4667d0d8992e610c8a",
            "text": "Hyper Text Markup Language",
            "count": 10,
            "percentage": 83.3
          },
          {
            "optionId": "60d21b4667d0d8992e610c8b",
            "text": "High Tech Multi Language",
            "count": 1,
            "percentage": 8.3
          },
          {
            "optionId": "60d21b4667d0d8992e610c8c",
            "text": "Hyper Transfer Markup Language",
            "count": 1,
            "percentage": 8.3
          },
          {
            "optionId": "60d21b4667d0d8992e610c8d",
            "text": "Hyperlink Text Management Language",
            "count": 0,
            "percentage": 0
          }
        ]
      },
      "explanation": "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
    }
    ```
  - **Description**: Sent when a question time is up

- **quiz:leaderboard** (server → client, broadcast)
  - **Data**: 
    ```json
    {
      "leaderboard": [
        {
          "userId": "60d21b4667d0d8992e610c85",
          "name": "John Doe",
          "score": 45,
          "lastQuestionCorrect": true,
          "lastQuestionScore": 10,
          "previousRank": 1,
          "currentRank": 1
        },
        {
          "userId": "60d21b4667d0d8992e610c95",
          "name": "Jane Smith",
          "score": 35,
          "lastQuestionCorrect": false,
          "lastQuestionScore": 0,
          "previousRank": 2,
          "currentRank": 2
        }
        // ... more participants
      ],
      "currentQuestion": 4,
      "totalQuestions": 10
    }
    ```
  - **Description**: Leaderboard update after each question

## Database Models

### User Model

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

### Quiz Model

```javascript
// models/Quiz.js
const mongoose = require('mongoose');
const shortid = require('shortid');

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
QuizSchema

```javascript
// ... continued from previous section
QuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz',
  justOne: false
});

// Generate share code before publishing
QuizSchema.methods.generateShareCode = function() {
  this.shareCode = shortid.generate();
  return this.shareCode;
};

// Update timestamps
QuizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);
```

### Question Model

```javascript
// models/Question.js
const mongoose = require('mongoose');

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

// Update timestamps
QuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Question', QuestionSchema);
```

### QuizAttempt Model

```javascript
// models/QuizAttempt.js
const mongoose = require('mongoose');

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

// Calculate score before saving
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
```

### LiveQuiz Model

```javascript
// models/LiveQuiz.js
const mongoose = require('mongoose');
const shortid = require('shortid');

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
  roomId: {
    type: String,
    unique: true,
    default: () => shortid.generate()
  },
  roomCode: {
    type: String,
    unique: true,
    default: () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed'],
    default: 'waiting'
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      ready: {
        type: Boolean,
        default: false
      },
      connected: {
        type: Boolean,
        default: true
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      score: {
        type: Number,
        default: 0
      },
      answers: [
        {
          questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
          },
          selectedOptionId: mongoose.Schema.Types.ObjectId,
          timeTaken: Number,
          isCorrect: Boolean,
          points: Number
        }
      ]
    }
  ],
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

// Populate quiz and host on find
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
```

### QuestionBank Model

```javascript
// models/QuestionBank.js
const mongoose = require('mongoose');

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

// Update timestamps
QuestionBankSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('QuestionBank', QuestionBankSchema);
```

## Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Authorization header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // Get token from cookie
    token = req.cookies.accessToken;
  }
  
  // Check if token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
  
  try {
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorResponse('The user belonging to this token no longer exists', 401));
    }
    
    // Grant access to protected route
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};
```

## Error Handling

```javascript
// utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
```

```javascript
// middleware/error.js
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log to console for dev
  console.log(err.stack);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
```

## Socket.IO Implementation

### LiveQuiz Handler

```javascript
// sockets/handlers/liveQuizHandler.js
const LiveQuiz = require('../../models/LiveQuiz');
const Question = require('../../models/Question');

exports.liveQuizHandler = (socket, io) => {
  // Join room event
  socket.on('join:room', async (data) => {
    try {
      const { roomCode, name } = data;
      
      // Validate room code
      const liveQuiz = await LiveQuiz.findOne({ roomCode });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Invalid room code' });
      }
      
      // Check if room is full
      if (liveQuiz.participants.length >= liveQuiz.settings.participantLimit) {
        return socket.emit('error', { message: 'Room is full' });
      }
      
      // Check if room allows late join
      if (liveQuiz.status === 'active' && !liveQuiz.settings.allowLateJoin) {
        return socket.emit('error', { message: 'Quiz already in progress' });
      }
      
      // Add participant to room
      const participantExists = liveQuiz.participants.find(
        p => p.userId && p.userId.toString() === socket.user.id
      );
      
      if (participantExists) {
        // Update existing participant
        participantExists.connected = true;
        participantExists.name = name || participantExists.name;
      } else {
        // Add new participant
        liveQuiz.participants.push({
          userId: socket.user.id,
          name: name || socket.user.name,
          connected: true,
          joinedAt: Date.now()
        });
      }
      
      await liveQuiz.save();
      
      // Join socket room
      socket.join(liveQuiz.roomId);
      
      // Notify other participants
      io.to(liveQuiz.roomId).emit('user:joined', {
        userId: socket.user.id,
        name: name || socket.user.name
      });
      
      // Send current quiz state
      socket.emit('room:joined', {
        roomId: liveQuiz.roomId,
        status: liveQuiz.status,
        currentQuestion: liveQuiz.currentQuestion,
        participants: liveQuiz.participants.map(p => ({
          userId: p.userId,
          name: p.name,
          ready: p.ready
        }))
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Error joining room' });
    }
  });
  
  // Leave room event
  socket.on('leave:room', async (data) => {
    try {
      const { roomId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) return;
      
      // Update participant status
      const participantIndex = liveQuiz.participants.findIndex(
        p => p.userId && p.userId.toString() === socket.user.id
      );
      
      if (participantIndex !== -1) {
        liveQuiz.participants[participantIndex].connected = false;
        await liveQuiz.save();
      }
      
      // Leave socket room
      socket.leave(roomId);
      
      // Notify other participants
      io.to(roomId).emit('user:left', {
        userId: socket.user.id,
        name: liveQuiz.participants[participantIndex]?.name || socket.user.name
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
  
  // Disconnect event
  socket.on('disconnect', async () => {
    try {
      // Find all rooms this user is in
      const liveQuizzes = await LiveQuiz.find({
        'participants.userId': socket.user.id,
        'participants.connected': true
      });
      
      // Update participant status in all rooms
      for (const quiz of liveQuizzes) {
        const participantIndex = quiz.participants.findIndex(
          p => p.userId && p.userId.toString() === socket.user.id
        );
        
        if (participantIndex !== -1) {
          quiz.participants[participantIndex].connected = false;
          await quiz.save();
          
          // Notify other participants
          io.to(quiz.roomId).emit('user:left', {
            userId: socket.user.id,
            name: quiz.participants[participantIndex].name
          });
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
};
```

### Participant Handler

```javascript
// sockets/handlers/participantHandler.js
const LiveQuiz = require('../../models/LiveQuiz');
const Question = require('../../models/Question');

exports.participantHandler = (socket, io) => {
  // Submit answer event
  socket.on('submit:answer', async (data) => {
    try {
      const { roomId, questionId, answerId, timeTaken } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz || liveQuiz.status !== 'active') {
        return socket.emit('error', { message: 'Quiz not active' });
      }
      
      // Find the question
      const question = await Question.findById(questionId);
      if (!question) {
        return socket.emit('error', { message: 'Question not found' });
      }
      
      // Find participant
      const participantIndex = liveQuiz.participants.findIndex(
        p => p.userId && p.userId.toString() === socket.user.id
      );
      
      if (participantIndex === -1) {
        return socket.emit('error', { message: 'Participant not found' });
      }
      
      // Check if already answered
      const existingAnswerIndex = liveQuiz.participants[participantIndex].answers.findIndex(
        a => a.questionId.toString() === questionId
      );
      
      if (existingAnswerIndex !== -1 && !liveQuiz.settings.allowRetry) {
        return socket.emit('error', { message: 'Answer already submitted' });
      }
      
      // Find selected option
      const selectedOption = question.options.find(
        opt => opt._id.toString() === answerId
      );
      
      if (!selectedOption) {
        return socket.emit('error', { message: 'Invalid answer option' });
      }
      
      // Calculate points (standard scoring or time-based)
      let points = 0;
      if (selectedOption.isCorrect) {
        if (liveQuiz.quiz.settings.scoringMode === 'time-based') {
          // Time-based scoring: faster answers get more points
          const maxTime = question.timeLimit || liveQuiz.quiz.settings.timePerQuestion;
          const timeRatio = 1 - (timeTaken / maxTime);
          points = Math.max(1, Math.round(question.points * (0.5 + (timeRatio * 0.5))));
        } else {
          // Standard scoring
          points = question.points;
        }
      }
      
      // Create answer object
      const answerObj = {
        questionId,
        selectedOptionId: answerId,
        timeTaken,
        isCorrect: selectedOption.isCorrect,
        points: selectedOption.isCorrect ? points : 0
      };
      
      // Add or update answer
      if (existingAnswerIndex !== -1) {
        liveQuiz.participants[participantIndex].answers[existingAnswerIndex] = answerObj;
      } else {
        liveQuiz.participants[participantIndex].answers.push(answerObj);
      }
      
      // Update participant score
      liveQuiz.participants[participantIndex].score = liveQuiz.participants[participantIndex].answers.reduce(
        (sum, answer) => sum + (answer.points || 0), 0
      );
      
      // Update question statistics
      const questionResultIndex = liveQuiz.questionResults.findIndex(
        qr => qr.questionId.toString() === questionId
      );
      
      if (questionResultIndex === -1) {
        // Create new question result
        liveQuiz.questionResults.push({
          questionId,
          correctAnswers: selectedOption.isCorrect ? 1 : 0,
          incorrectAnswers: selectedOption.isCorrect ? 0 : 1,
          averageResponseTime: timeTaken,
          optionDistribution: question.options.map(opt => ({
            optionId: opt._id,
            count: opt._id.toString() === answerId ? 1 : 0,
            percentage: opt._id.toString() === answerId ? 100 : 0
          }))
        });
      } else {
        // Update existing question result
        const qResult = liveQuiz.questionResults[questionResultIndex];
        
        if (selectedOption.isCorrect) {
          qResult.correctAnswers++;
        } else {
          qResult.incorrectAnswers++;
        }
        
        // Update average response time
        const totalResponses = qResult.correctAnswers + qResult.incorrectAnswers;
        qResult.averageResponseTime = ((qResult.averageResponseTime * (totalResponses - 1)) + timeTaken) / totalResponses;
        
        // Update option distribution
        const optionIndex = qResult.optionDistribution.findIndex(
          opt => opt.optionId.toString() === answerId
        );
        
        if (optionIndex !== -1) {
          qResult.optionDistribution[optionIndex].count++;
        }
        
        // Recalculate percentages
        const totalAnswers = qResult.optionDistribution.reduce(
          (sum, opt) => sum + opt.count, 0
        );
        
        qResult.optionDistribution.forEach(opt => {
          opt.percentage = (opt.count / totalAnswers) * 100;
        });
      }
      
      await liveQuiz.save();
      
      // Confirm answer received
      socket.emit('answer:received', {
        received: true,
        questionId
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Error submitting answer' });
    }
  });
  
  // Ready status event
  socket.on('ready:status', async (data) => {
    try {
      const { roomId, ready } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Find participant
      const participantIndex = liveQuiz.participants.findIndex(
        p => p.userId && p.userId.toString() === socket.user.id
      );
      
      if (participantIndex === -1) {
        return socket.emit('error', { message: 'Participant not found' });
      }
      
      // Update ready status
      liveQuiz.participants[participantIndex].ready = ready;
      await liveQuiz.save();
      
      // Notify all participants
      io.to(roomId).emit('participant:status', {
        userId: socket.user.id,
        name: liveQuiz.participants[participantIndex].name,
        ready
      });
    } catch (error) {
      console.error('Error updating ready status:', error);
      socket.emit('error', { message: 'Error updating ready status' });
    }
  });
};
```

### Host Handler

```javascript
// sockets/handlers/hostHandler.js
const LiveQuiz = require('../../models/LiveQuiz');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');

exports.hostHandler = (socket, io) => {
  // Start quiz event
  socket.on('host:start-quiz', async (data) => {
    try {
      const { roomId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Verify user is host
      if (liveQuiz.host.toString() !== socket.user.id) {
        return socket.emit('error', { message: 'Only host can start the quiz' });
      }
      
      // Check if quiz is already active
      if (liveQuiz.status === 'active') {
        return socket.emit('error', { message: 'Quiz already started' });
      }
      
      // Update quiz status
      liveQuiz.status = 'active';
      liveQuiz.startedAt = Date.now();
      liveQuiz.currentQuestion = 0;
      await liveQuiz.save();
      
      // Get quiz details
      const quiz = await Quiz.findById(liveQuiz.quiz);
      const questions = await Question.find({ quizId: quiz._id }).sort('order');
      
      // Notify all participants
      io.to(roomId).emit('quiz:start', {
        quizId: quiz._id,
        totalQuestions: questions.length
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      socket.emit('error', { message: 'Error starting quiz' });
    }
  });
  
  // Next question event
  socket.on('host:next-question', async (data) => {
    try {
      const { roomId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Verify user is host
      if (liveQuiz.host.toString() !== socket.user.id) {
        return socket.emit('error', { message: 'Only host can control the quiz' });
      }
      
      // Check if quiz is active
      if (liveQuiz.status !== 'active') {
        return socket.emit('error', { message: 'Quiz is not active' });
      }
      
      // Get quiz questions
      const questions = await Question.find({ quizId: liveQuiz.quiz._id }).sort('order');
      
      // Check if there are more questions
      if (liveQuiz.currentQuestion >= questions.length) {
        // End the quiz
        liveQuiz.status = 'completed';
        liveQuiz.endedAt = Date.now();
        await liveQuiz.save();
        
        // Send final results
        const results = await formatFinalResults(liveQuiz._id);
        io.to(roomId).emit('quiz:end', results);
        return;
      }
      
      // If current question is > 0, send leaderboard for previous question
      if (liveQuiz.currentQuestion > 0 && liveQuiz.settings.showLeaderboardAfterEachQuestion) {
        const leaderboard = formatLeaderboard(liveQuiz);
        io.to(roomId).emit('quiz:leaderboard', {
          leaderboard,
          currentQuestion: liveQuiz.currentQuestion,
          totalQuestions: questions.length
        });
        
        // Wait a bit before sending next question
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Get current question
      const currentQuestion = questions[liveQuiz.currentQuestion];
      
      // Update live quiz
      liveQuiz.currentQuestion++;
      await liveQuiz.save();
      
      // Format question for participants (remove correct answer)
      const formattedQuestion = {
        questionId: currentQuestion._id,
        questionText: currentQuestion.questionText,
        questionType: currentQuestion.questionType,
        image: currentQuestion.image,
        options: currentQuestion.options.map(opt => ({
          _id: opt._id,
          text: opt.text
        })),
        timeLimit: currentQuestion.timeLimit || liveQuiz.quiz.settings.timePerQuestion,
        questionNumber: liveQuiz.currentQuestion
      };
      
      // Send question to all participants
      io.to(roomId).emit('quiz:question', formattedQuestion);
      
      // Start timer
      const timeLimit = formattedQuestion.timeLimit;
      let remainingTime = timeLimit;
      
      const timerInterval = setInterval(() => {
        remainingTime--;
        
        io.to(roomId).emit('quiz:timer', {
          questionId: currentQuestion._id,
          remainingTime,
          totalTime: timeLimit
        });
        
        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          
          // Send question end event with correct answers
          const questionEnd = {
            questionId: currentQuestion._id,
            correctAnswerId: currentQuestion.options.find(opt => opt.isCorrect)._id,
            statistics: formatQuestionStatistics(liveQuiz, currentQuestion._id),
            explanation: currentQuestion.explanation
          };
          
          io.to(roomId).emit('quiz:question-end', questionEnd);
        }
      }, 1000);
    } catch (error) {
      console.error('Error sending next question:', error);
      socket.emit('error', { message: 'Error sending next question' });
    }
  });
  
  // Pause quiz event
  socket.on('host:pause-quiz', async (data) => {
    try {
      const { roomId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Verify user is host
      if (liveQuiz.host.toString() !== socket.user.id) {
        return socket.emit('error', { message: 'Only host can control the quiz' });
      }
      
      // Update quiz status
      liveQuiz.status = 'paused';
      await liveQuiz.save();
      
      // Notify all participants
      io.to(roomId).emit('quiz:paused', {
        message: 'Quiz has been paused by the host'
      });
    } catch (error) {
      console.error('Error pausing quiz:', error);
      socket.emit('error', { message: 'Error pausing quiz' });
    }
  });
  
  // Resume quiz event
  socket.on('host:resume-quiz', async (data) => {
    try {
      const { roomId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Verify user is host
      if (liveQuiz.host.toString() !== socket.user.id) {
        return socket.emit('error', { message: 'Only host can control the quiz' });
      }
      
      // Check if quiz is paused
      if (liveQuiz.status !== 'paused') {
        return socket.emit('error', { message: 'Quiz is not paused' });
      }
      
      // Update quiz status
      liveQuiz.status = 'active';
      await liveQuiz.save();
      
      // Notify all participants
      io.to(roomId).emit('quiz:resumed', {
        message: 'Quiz has been resumed by the host'
      });
    } catch (error) {
      console.error('Error resuming quiz:', error);
      socket.emit('error', { message: 'Error resuming quiz' });
    }
  });
  
  // End quiz event
  socket.on('host:end-quiz', async (data) => {
    try {
      const { roomId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Verify user is host
      if (liveQuiz.host.toString() !== socket.user.id) {
        return socket.emit('error', { message: 'Only host can end the quiz' });
      }
      
      // Check if quiz is already completed
      if (liveQuiz.status === 'completed') {
        return socket.emit('error', { message: 'Quiz is already completed' });
      }
      
      // Update quiz status
      liveQuiz.status = 'completed';
      liveQuiz.endedAt = Date.now();
      await liveQuiz.save();
      
      // Send final results
      const results = await formatFinalResults(liveQuiz._id);
      io.to(roomId).emit('quiz:end', results);
    } catch (error) {
      console.error('Error ending quiz:', error);
      socket.emit('error', { message: 'Error ending quiz' });
    }
  });
  
  // Remove participant event
  socket.on('host:remove-participant', async (data) => {
    try {
      const { roomId, userId } = data;
      
      // Find the live quiz
      const liveQuiz = await LiveQuiz.findOne({ roomId });
      if (!liveQuiz) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Verify user is host
      if (liveQuiz.host.toString() !== socket.user.id) {
        return socket.emit('error', { message: 'Only host can remove participants' });
      }
      
      // Find participant
      const participantIndex = liveQuiz.participants.findIndex(
        p => p.userId && p.userId.toString() === userId
      );
      
      if (participantIndex === -1) {
        return socket.emit('error', { message: 'Participant not found' });
      }
      
      // Remove participant
      const removedParticipant = liveQuiz.participants[participantIndex];
      liveQuiz.participants.splice(participantIndex, 1);
      await liveQuiz.save();
      
      // Notify all participants
      io.to(roomId).emit('participant:removed', {
        userId,
        name: removedParticipant.name
      });
      
      // Send direct message to removed participant
      io.to(userId).emit('you:removed', {
        message: 'You have been removed from the quiz by the host'
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      socket.emit('error', { message: 'Error removing participant' });
    }
  });
};

// Helper functions
const formatLeaderboard = (liveQuiz) => {
  // Sort participants by score (descending)
  const sortedParticipants = [...liveQuiz.participants]
    .filter(p => p.connected)
    .sort((a, b) => b.score - a.score);
  
  // Format leaderboard data
  return sortedParticipants.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    name: p.name,
    score: p.score,
    answeredQuestions: p.answers.length
  }));
};

const formatQuestionStatistics = (liveQuiz, questionId) => {
  const questionResult = liveQuiz.questionResults.find(
    qr => qr.questionId.toString() === questionId.toString()
  );
  
  if (!questionResult) {
    return {
      totalAnswers: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      answerDistribution: []
    };
  }
  
  return {
    totalAnswers: questionResult.correctAnswers + questionResult.incorrectAnswers,
    correctAnswers: questionResult.correctAnswers,
    incorrectAnswers: questionResult.incorrectAnswers,
    averageResponseTime: questionResult.averageResponseTime.toFixed(2),
    answerDistribution: questionResult.optionDistribution
  };
};

const formatFinalResults = async (liveQuizId) => {
  const liveQuiz = await LiveQuiz.findById(liveQuizId)
    .populate({
      path: 'quiz',
      select: 'title description settings'
    })
    .populate({
      path: 'participants.answers.questionId',
      select: 'questionText options'
    });
  
  // Format overall results
  const sortedParticipants = [...liveQuiz.participants]
    .sort((a, b) => b.score - a.score);
  
  // Calculate top performers
  const topPerformers = sortedParticipants.slice(0, 3).map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    name: p.name,
    score: p.score
  }));
  
  // Calculate question statistics
  const questionStats = await Promise.all(
    liveQuiz.questionResults.map(async (qr) => {
      const question = await Question.findById(qr.questionId);
      return {
        questionId: qr.questionId,
        questionText: question.questionText,
        correctAnswers: qr.correctAnswers,
        incorrectAnswers: qr.incorrectAnswers,
        totalAnswers: qr.correctAnswers + qr.incorrectAnswers,
        correctPercentage: qr.correctAnswers / (qr.correctAnswers + qr.incorrectAnswers) * 100,
        averageResponseTime: qr.averageResponseTime,
        optionDistribution: qr.optionDistribution
      };
    })
  );
  
  return {
    quizId: liveQuiz.quiz._id,
    quizTitle: liveQuiz.quiz.title,
    startedAt: liveQuiz.startedAt,
    endedAt: liveQuiz.endedAt,
    duration: (liveQuiz.endedAt - liveQuiz.startedAt) / 1000, // in seconds
    participantCount: liveQuiz.participants.length,
    topPerformers,
    leaderboard: sortedParticipants.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      name: p.name,
      score: p.score,
      answeredQuestions: p.answers.length
    })),
    questionStats
  };
};
```
