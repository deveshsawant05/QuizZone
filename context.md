# QuizZone A Quiz Application

## 1. High-Level System Architecture

```
┌─────────────────┐     ┌─────────────────────────────────┐     ┌─────────────────┐
│                 │     │                                 │     │                 │
│  React Frontend │◄────┤ Express.js + Node.js Backend    │◄────┤ MongoDB Database│
│  (Tailwind CSS) │     │ (REST API + Socket.IO Server)   │     │                 │
│                 │     │                                 │     │                 │
└────────┬────────┘     └─────────────────┬───────────────┘     └─────────────────┘
         │                                │
         │                                │
         │                                │
┌────────▼────────┐     ┌─────────────────▼───────────────┐
│                 │     │                                 │
│ Browser/Client  │◄────┤        External Services        │
│                 │     │  (OAuth, AI Question Generator) │
│                 │     │                                 │
└─────────────────┘     └─────────────────────────────────┘
```

### Core Components:

1. **Frontend Layer**: React.js application with Tailwind CSS for styling
2. **Backend Layer**: Express.js/Node.js server providing REST APIs and WebSocket connections
3. **Database Layer**: MongoDB for data persistence
4. **External Services**: OAuth providers, AI question generation (optional)

### Communication Flow:

- **HTTP/REST**: For standard CRUD operations, authentication, and asynchronous features
- **WebSockets**: For real-time quiz functionality, live leaderboards, and instant updates

## 2. Module Breakdown

### Frontend Modules

1. **Authentication Module**
   - User registration
   - Login
   - Password reset
   - Profile management

2. **Quiz Creation Module**
   - Static quiz builder
   - Real-time quiz configuration
   - Question management
   - AI question generation integration (optional)

3. **Quiz Participation Module**
   - Static quiz solver
   - Real-time quiz participation
   - Answer submission
   - Timer management

4. **Results & Analytics Module**
   - Score display
   - Performance analytics
   - Historical data visualization
   - Leaderboards

5. **Admin/Host Module**
   - Live quiz control panel
   - Participant management
   - Quiz flow control (start/pause/end)

6. **Core UI Components**
   - Question display
   - Timer component
   - Answer option selector
   - Leaderboard display
   - Navigation

### Backend Modules

1. **Authentication Service**
   - JWT token management
   - User verification
   - Session handling
   - OAuth integration

2. **Quiz Management Service**
   - Quiz CRUD operations
   - Question bank management
   - Share link generation
   - Access control

3. **Real-Time Service**
   - WebSocket connection management
   - Live quiz state management
   - Synchronized timers
   - Real-time leaderboard updates

4. **User Service**
   - User profile management
   - Quiz history
   - Performance analytics
   - Role management

5. **AI Service (Optional)**
   - Question generation
   - Hint/explanation generation
   - Content validation

6. **Security Service**
   - Rate limiting
   - Input validation
   - Anti-cheating measures
   - Data sanitization

## 3. API Design

### Authentication APIs

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/profile
PUT  /api/auth/profile
```

### Quiz Management APIs

```
POST /api/quizzes              # Create new quiz
GET  /api/quizzes              # Get all quizzes by current user
GET  /api/quizzes/:quizId      # Get specific quiz details
PUT  /api/quizzes/:quizId      # Update quiz
DELETE /api/quizzes/:quizId    # Delete quiz

POST /api/quizzes/:quizId/questions     # Add question to quiz
PUT  /api/quizzes/:quizId/questions/:questionId  # Update question
DELETE /api/quizzes/:quizId/questions/:questionId  # Delete question

POST /api/quizzes/:quizId/publish       # Publish quiz (generate share link)
GET  /api/quizzes/shared/:shareCode     # Access shared quiz

POST /api/quizzes/:quizId/attempt       # Start quiz attempt
POST /api/quizzes/:quizId/submit        # Submit quiz answers
GET  /api/quizzes/:quizId/results       # Get quiz results
```

### Live Quiz APIs

```
POST /api/live-quizzes                  # Create live quiz session
GET  /api/live-quizzes/:roomId          # Get live quiz details
PUT  /api/live-quizzes/:roomId          # Update live quiz settings
DELETE /api/live-quizzes/:roomId        # End live quiz session

POST /api/live-quizzes/:roomId/start    # Start live quiz
POST /api/live-quizzes/:roomId/next     # Move to next question
POST /api/live-quizzes/:roomId/pause    # Pause live quiz
POST /api/live-quizzes/:roomId/resume   # Resume live quiz
POST /api/live-quizzes/:roomId/end      # End live quiz

GET  /api/live-quizzes/:roomId/results  # Get live quiz results
```

### User Analytics APIs

```
GET  /api/users/me/quizzes              # Get user's created quizzes
GET  /api/users/me/attempts             # Get user's quiz attempts
GET  /api/users/me/statistics           # Get performance statistics
```

### AI Generation APIs (Optional)

```
POST /api/ai/generate-questions         # Generate questions from topic
POST /api/ai/generate-explanation       # Generate answer explanation
```

## 4. WebSocket Flow

### Socket Events (Server → Client)

```
quiz:start           # Quiz has started
quiz:question        # New question pushed
quiz:timer           # Timer updates
quiz:question:end    # Question timer ended
quiz:leaderboard     # Leaderboard update
quiz:end             # Quiz ended
user:joined          # New user joined
user:left            # User left
host:message         # Message from host
error                # Error notification
```

### Socket Events (Client → Server)

```
join:room            # Join a live quiz room
leave:room           # Leave a live quiz room
submit:answer        # Submit answer to question
host:start-quiz      # Host starts quiz
host:next-question   # Host moves to next question
host:pause-quiz      # Host pauses quiz
host:resume-quiz     # Host resumes quiz
host:end-quiz        # Host ends quiz
ping                 # Connection check
```

### WebSocket Flow for Real-Time Quiz

1. **Initialization Phase**
   - Host creates live quiz and gets room code
   - Participants join room using code
   - Server validates participants and acknowledges connection
   - Host is notified of participant joins

2. **Quiz Start Phase**
   - Host initiates quiz start
   - Server broadcasts "quiz:start" event to all participants
   - Server prepares first question

3. **Question Phase**
   - Server pushes question to all participants simultaneously
   - Server starts question timer
   - Server broadcasts timer updates periodically
   - Participants submit answers
   - Server records timestamps and validates answers

4. **Leaderboard Update Phase**
   - After question timeout or all answers received
   - Server calculates scores based on correctness and timing
   - Server pushes updated leaderboard to all participants
   - Server prepares for next question

5. **Quiz End Phase**
   - After final question or host-initiated end
   - Server calculates final scores
   - Server broadcasts final results and statistics
   - Server closes WebSocket connections or keeps alive for chat

## 5. Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  profilePicture: String (URL),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  role: String (enum: "user", "admin"),
  oauthProviders: [
    {
      provider: String (e.g., "google", "facebook"),
      providerId: String,
      email: String,
      lastLogin: Date
    }
  ]
}
```

### Quizzes Collection

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  coverImage: String (URL),
  creator: ObjectId (ref: Users),
  type: String (enum: "static", "live"),
  isPublished: Boolean,
  shareCode: String (unique),
  settings: {
    timePerQuestion: Number (seconds),
    randomizeQuestions: Boolean,
    showCorrectAnswers: Boolean,
    showExplanations: Boolean,
    scoringMode: String (enum: "standard", "timed"),
    passingScore: Number
  },
  createdAt: Date,
  updatedAt: Date,
  questions: [ObjectId] (ref: Questions),
  tags: [String]
}
```

### Questions Collection

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: Quizzes),
  questionText: String,
  questionType: String (enum: "multiple_choice", "true_false", "short_answer"),
  image: String (URL, optional),
  options: [
    {
      _id: ObjectId,
      text: String,
      isCorrect: Boolean
    }
  ],
  correctAnswer: String (for short_answer type),
  explanation: String,
  points: Number,
  timeLimit: Number (seconds, optional override),
  createdAt: Date,
  order: Number
}
```

### QuizAttempts Collection

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: Quizzes),
  userId: ObjectId (ref: Users),
  startedAt: Date,
  completedAt: Date,
  totalScore: Number,
  maxPossibleScore: Number,
  answers: [
    {
      questionId: ObjectId (ref: Questions),
      selectedOptionId: ObjectId,
      textAnswer: String,
      isCorrect: Boolean,
      timeTaken: Number (seconds),
      points: Number
    }
  ],
  ipAddress: String,
  userAgent: String
}
```

### LiveRooms Collection

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: Quizzes),
  hostId: ObjectId (ref: Users),
  roomCode: String (unique),
  status: String (enum: "waiting", "active", "paused", "completed"),
  currentQuestion: {
    questionId: ObjectId (ref: Questions),
    startedAt: Date,
    endedAt: Date,
    order: Number
  },
  participants: [
    {
      userId: ObjectId (ref: Users),
      name: String,
      connected: Boolean,
      joinedAt: Date,
      score: Number,
      answers: [
        {
          questionId: ObjectId (ref: Questions),
          answeredAt: Date,
          selectedOptionId: ObjectId,
          textAnswer: String,
          isCorrect: Boolean,
          timeTaken: Number (seconds),
          points: Number
        }
      ]
    }
  ],
  settings: {
    showLeaderboard: Boolean,
    timePerQuestion: Number (seconds),
    scoringMode: String (enum: "standard", "timed")
  },
  createdAt: Date,
  startedAt: Date,
  endedAt: Date
}
```

## 6. User Flows

### Type A: Static Quiz Flow

1. **Quiz Creation Flow**
   - Creator logs in
   - Creator selects "Create Quiz" option
   - Creator enters quiz details (title, description, settings)
   - Creator adds questions one by one
   - Creator configures answer options
   - Creator sets correct answers and explanations
   - Creator saves quiz as draft or publishes
   - If published, system generates unique share link

2. **Quiz Taking Flow**
   - User receives share link
   - User logs in (if not already)
   - User sees quiz introduction page
   - User starts quiz
   - System presents questions sequentially
   - User answers questions within time limits (if applicable)
   - User submits quiz
   - System processes answers and calculates score
   - System displays results and correct answers (if enabled)
   - User can review answers and explanations

### Type B: Real-Time Quiz Flow

1. **Quiz Hosting Flow**
   - Host logs in
   - Host selects "Create Live Quiz" option
   - Host configures live quiz settings
   - Host selects existing questions or creates new ones
   - Host finalizes quiz and gets room code
   - Host shares room code with participants
   - Host waits for participants to join
   - Host controls quiz flow:
     - Starts quiz
     - Monitors participant progress
     - Advances to next question
     - Pauses/resumes if needed
     - Ends quiz
   - Host reviews final results

2. **Quiz Participation Flow**
   - Participant logs in
   - Participant enters room code
   - Participant joins waiting room
   - Participant waits for host to start
   - When quiz starts:
     - Questions appear in real time
     - Timer counts down
     - Participant selects/submits answer
     - System provides immediate feedback (if enabled)
     - Leaderboard updates after each question
   - After final question, participant sees final results and rankings

## 7. Security Considerations

### Authentication Security

1. **Password Security**
   - Use bcrypt for password hashing with appropriate salt rounds
   - Implement password complexity requirements
   - Store only hashed passwords, never plain text

2. **JWT Implementation**
   - Short-lived access tokens (15-30 minutes)
   - Longer-lived refresh tokens with secure storage
   - Include token rotation for refresh tokens
   - Implement token blacklisting for logged out tokens

3. **Session Management**
   - Automatic session timeout
   - Enable forced logout from all devices
   - Track session metadata (IP, device)

### API Security

1. **Request Validation**
   - Implement comprehensive input validation
   - Use middleware for sanitization
   - Validate request content types and sizes

2. **Rate Limiting**
   - Implement per-endpoint rate limiting
   - Apply stricter limits for authentication endpoints
   - Use sliding window rate limiting for WebSocket connections

3. **CORS Configuration**
   - Restrict origins to known frontend domains
   - Limit allowed HTTP methods and headers
   - Handle preflight requests properly

### WebSocket Security

1. **Connection Security**
   - Authenticate WebSocket connections with tokens
   - Implement connection heartbeats
   - Monitor and limit connections per user
   - Set idle timeout for inactive connections

2. **Data Validation**
   - Validate all incoming WebSocket messages
   - Implement message size limits
   - Sanitize data before processing

### Anti-Cheating Measures

1. **Quiz Integrity**
   - Serve questions individually, not all at once
   - Randomize question and answer orders
   - Store timestamp of answer submissions
   - Validate answering time against question time limit

2. **Session Integrity**
   - Detect and handle multiple simultaneous logins
   - Track IP address changes during quiz sessions
   - Implement browser fingerprinting (optional)
   - Monitor unusual answer patterns

3. **Live Quiz Protection**
   - Server-side timer validation
   - Question pushing on demand only
   - Answer submission window checks
   - Detect and handle reconnection attempts

### Data Security

1. **Database Security**
   - Implement proper access controls
   - Encrypt sensitive data fields
   - Use database connection pooling with limits
   - Set up proper indexing for performance

2. **Error Handling**
   - Generic error messages to users
   - Detailed internal logging
   - Prevent information leakage in responses
