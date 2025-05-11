# Frontend Specification

## Page Structure Overview

```
└── App
    ├── Authentication Pages
    │   ├── Login Page
    │   ├── Register Page
    │   ├── Forgot Password Page
    │   └── Reset Password Page
    │
    ├── Dashboard (Protected)
    │   ├── User Dashboard
    │   └── Analytics Dashboard
    │
    ├── Quiz Creation (Protected)
    │   ├── Quiz Type Selection
    │   ├── Static Quiz Builder
    │   ├── Live Quiz Builder
    │   └── Question Bank Manager
    │
    ├── Quiz Participation
    │   ├── Static Quiz Player
    │   ├── Live Quiz Waiting Room
    │   └── Live Quiz Player
    │
    ├── Results Pages
    │   ├── Static Quiz Results
    │   ├── Live Quiz Results
    │   └── Historical Results
    │
    └── Host Control Panel (Protected)
        ├── Participant Manager
        ├── Quiz Flow Control
        └── Live Statistics
```

## Component Hierarchy

```
├── Layout Components
│   ├── MainLayout
│   ├── AuthLayout
│   └── DashboardLayout
│
├── Authentication Components
│   ├── LoginForm
│   ├── RegisterForm
│   ├── PasswordResetForm
│   └── ProfileEditor
│
├── Quiz Builder Components
│   ├── QuizDetailsForm
│   ├── QuestionEditor
│   ├── AnswerOptionsEditor
│   ├── QuizSettingsForm
│   └── AIQuestionGenerator
│
├── Quiz Participation Components
│   ├── QuestionDisplay
│   ├── AnswerSelector
│   ├── Timer
│   ├── ProgressIndicator
│   └── ResultFeedback
│
├── Live Quiz Components
│   ├── RoomCodeDisplay
│   ├── ParticipantList
│   ├── LiveLeaderboard
│   ├── HostControls
│   └── SynchronizedTimer
│
└── Shared Components
    ├── Button
    ├── Input
    ├── Modal
    ├── Toast
    ├── Loader
    └── Card
```

## Detailed Page Specifications

### 1. Authentication Pages

#### Login Page
- **Path**: `/login`
- **Components**: LoginForm
- **State**: user credentials, loading state, error messages
- **API Integration**: `POST /api/auth/login`
- **Navigation**:
  - Success: Redirect to dashboard
  - Links to registration and password reset

#### Register Page
- **Path**: `/register`
- **Components**: RegisterForm
- **State**: user details, loading state, error messages
- **API Integration**: `POST /api/auth/register`
- **Navigation**:
  - Success: Redirect to dashboard or email verification
  - Link to login

#### Forgot Password Page
- **Path**: `/forgot-password`
- **Components**: PasswordResetRequestForm
- **State**: email, loading state, success/error messages
- **API Integration**: `POST /api/auth/forgot-password`
- **Navigation**: Link to login

#### Reset Password Page
- **Path**: `/reset-password/:token`
- **Components**: PasswordResetForm
- **State**: new password, confirm password, token validation
- **API Integration**: `POST /api/auth/reset-password`
- **Navigation**: Success redirects to login

### 2. Dashboard Pages

#### User Dashboard
- **Path**: `/dashboard`
- **Components**: DashboardLayout, QuizList, StatsSummary
- **State**: user quizzes, recent attempts, loading states
- **API Integration**:
  - `GET /api/quizzes` (created quizzes)
  - `GET /api/users/me/attempts` (recent attempts)
- **Features**:
  - Created quizzes with stats
  - Recently taken quizzes
  - Quick actions for quiz creation/participation

#### Analytics Dashboard
- **Path**: `/dashboard/analytics`
- **Components**: DashboardLayout, PerformanceCharts, QuizStatistics
- **State**: quiz performance data, participant data
- **API Integration**: `GET /api/users/me/statistics`
- **Features**:
  - Performance trends charts
  - Quiz completion rates
  - Average scores
  - Participant statistics for hosted quizzes

### 3. Quiz Creation Pages

#### Quiz Type Selection
- **Path**: `/create`
- **Components**: QuizTypeSelector
- **State**: selected quiz type
- **Navigation**:
  - Static Quiz: Navigate to `/create/static`
  - Live Quiz: Navigate to `/create/live`

#### Static Quiz Builder
- **Path**: `/create/static`
- **Components**: QuizDetailsForm, QuestionList, QuestionEditor
- **State**: quiz details, questions array, current question
- **API Integration**:
  - `POST /api/quizzes` (create quiz)
  - `POST /api/quizzes/:quizId/questions` (add questions)
  - `PUT /api/quizzes/:quizId` (update quiz)
  - `POST /api/quizzes/:quizId/publish` (publish)
- **Features**:
  - Multi-step quiz creation flow
  - Question bank integration
  - Preview functionality
  - Save as draft option

#### Live Quiz Builder
- **Path**: `/create/live`
- **Components**: QuizDetailsForm, QuestionList, QuestionEditor, LiveQuizSettings
- **State**: quiz details, questions array, live quiz settings
- **API Integration**:
  - Same as Static Quiz Builder
  - Additional settings specific to live quizzes
- **Features**:
  - Live quiz specific settings
  - Timer configuration
  - Leaderboard settings
  - Participant limits

#### Question Bank Manager
- **Path**: `/question-bank`
- **Components**: QuestionFilters, QuestionList, QuestionEditor
- **State**: questions list, filters, pagination
- **API Integration**:
  - `GET /api/questions` (list all questions)
  - `POST /api/questions` (create question)
  - `PUT /api/questions/:id` (update question)
  - `DELETE /api/questions/:id` (delete question)
- **Features**:
  - Filter by tags, type, difficulty
  - Import/export questions
  - AI question generation integration

### 4. Quiz Participation Pages

#### Static Quiz Player
- **Path**: `/quiz/:shareCode`
- **Components**: QuestionDisplay, AnswerSelector, ProgressIndicator
- **State**: quiz data, current question, answers, timer
- **API Integration**:
  - `GET /api/quizzes/shared/:shareCode` (access quiz)
  - `POST /api/quizzes/:quizId/attempt` (start attempt)
  - `POST /api/quizzes/:quizId/submit` (submit answers)
- **Features**:
  - Question navigation
  - Answer saving
  - Progress tracking
  - Timer (if enabled)

#### Live Quiz Waiting Room
- **Path**: `/live-quiz/join`
- **Components**: RoomCodeEntry, WaitingRoom, ParticipantList
- **State**: room code, connection status, participant list
- **API Integration**:
  - `GET /api/live-quizzes/:roomId` (validate room)
- **WebSocket Events**:
  - `join:room` (client → server)
  - `user:joined` (server → client)
  - `quiz:start` (server → client)
- **Features**:
  - Room code entry
  - Waiting for host indication
  - Participant list display
  - Ready status toggle

#### Live Quiz Player
- **Path**: `/live-quiz/:roomId/play`
- **Components**: QuestionDisplay, AnswerSelector, Timer, LiveLeaderboard
- **State**: current question, timer state, answers, leaderboard data
- **API Integration**: Primarily WebSocket-based
- **WebSocket Events**:
  - `quiz:question` (server → client)
  - `quiz:timer` (server → client)
  - `submit:answer` (client → server)
  - `quiz:leaderboard` (server → client)
  - `quiz:end` (server → client)
- **Features**:
  - Real-time question display
  - Synchronized timer
  - Answer submission
  - Immediate feedback (if enabled)
  - Live leaderboard updates

### 5. Results Pages

#### Static Quiz Results
- **Path**: `/quiz/:quizId/results/:attemptId`
- **Components**: ResultsSummary, AnswerReview, ScoreDisplay
- **State**: quiz results, correct answers, explanations
- **API Integration**: `GET /api/quizzes/:quizId/results`
- **Features**:
  - Score overview
  - Correct/incorrect answers highlighting
  - Answer explanations
  - Option to retry or share results

#### Live Quiz Results
- **Path**: `/live-quiz/:roomId/results`
- **Components**: FinalLeaderboard, ResultsSummary, ParticipantStats
- **State**: final leaderboard, individual results
- **API Integration**: `GET /api/live-quizzes/:roomId/results`
- **Features**:
  - Final rankings
  - Individual performance metrics
  - Question-by-question breakdown
  - Social sharing options

#### Historical Results
- **Path**: `/dashboard/history`
- **Components**: ResultsList, ResultFilters, PerformanceCharts
- **State**: historical results, filters, pagination
- **API Integration**: `GET /api/users/me/attempts`
- **Features**:
  - Filter by quiz type, date, score
  - Performance trends
  - Comparison with other attempts
  - Detailed view option

### 6. Host Control Panel

#### Participant Manager
- **Path**: `/live-quiz/:roomId/host/participants`
- **Components**: ParticipantList, ParticipantActions
- **State**: participant list, connection status
- **API Integration**: WebSocket-based participant data
- **WebSocket Events**:
  - `user:joined` (server → client)
  - `user:left` (server → client)
- **Features**:
  - View all participants
  - Remove participants
  - Ban participants
  - Send messages to participants

#### Quiz Flow Control
- **Path**: `/live-quiz/:roomId/host`
- **Components**: QuestionPreview, TimerControl, QuizProgressDisplay
- **State**: current question, timer state, quiz progress
- **API Integration**:
  - `POST /api/live-quizzes/:roomId/start`
  - `POST /api/live-quizzes/:roomId/next`
  - `POST /api/live-quizzes/:roomId/pause`
  - `POST /api/live-quizzes/:roomId/resume`
  - `POST /api/live-quizzes/:roomId/end`
- **WebSocket Events**:
  - `host:start-quiz` (client → server)
  - `host:next-question` (client → server)
  - `host:pause-quiz` (client → server)
  - `host:resume-quiz` (client → server)
  - `host:end-quiz` (client → server)
- **Features**:
  - Start quiz
  - Navigate through questions
  - Pause/resume quiz
  - End quiz early
  - View real-time statistics

#### Live Statistics
- **Path**: `/live-quiz/:roomId/host/stats`
- **Components**: AnswerDistribution, ResponseTimeGraph, ParticipantProgress
- **State**: answer data, response time data, progress data
- **API Integration**: WebSocket-based statistics data
- **Features**:
  - Real-time answer distribution
  - Response time visualization
  - Participant progress tracking
  - Question difficulty assessment

## UI Component Details

### Core Interactive Components

#### QuestionDisplay
- **Props**: question object, question type, images, time limit
- **State**: loading state, media loading state
- **Features**:
  - Displays question text
  - Shows images/media if included
  - Adapts to different question types
  - Displays timer if applicable

#### AnswerSelector
- **Props**: question type, answer options, selection mode
- **State**: selected answer(s), validation state
- **Events**: onAnswerSelect, onAnswerSubmit
- **Features**:
  - Multiple choice radio buttons
  - True/False toggle
  - Short answer text input
  - Multiple select checkboxes
  - Answer validation

#### Timer
- **Props**: duration, mode (countdown/elapsed), sync timestamp
- **State**: remaining time, active state, warning threshold
- **Events**: onTimeExpired, onTimeWarning
- **Features**:
  - Visual countdown
  - Synced with server time
  - Color changes at warning thresholds
  - Sound alerts (optional)

#### LiveLeaderboard
- **Props**: participant list, scores, current user
- **State**: sorted rankings, animation state
- **Features**:
  - Real-time updates
  - Highlights current user
  - Animated position changes
  - Score and rank display

### Host Control Components

#### HostControls
- **Props**: quiz state, current question, timer status
- **State**: control states, confirmation dialogs
- **Events**: onStart, onNext, onPause, onResume, onEnd
- **Features**:
  - Start quiz button
  - Next question button
  - Pause/resume toggle
  - End quiz button
  - Emergency override controls

#### ParticipantList
- **Props**: participant array, connection status
- **State**: sorted/filtered participants
- **Events**: onRemove, onBan, onMessage
- **Features**:
  - List of all participants
  - Connection status indicators
  - Search and sort functionality
  - Action buttons for management

## Frontend-Backend Integration

### Authentication Flow

1. **Login Process**:
   - User submits credentials via LoginForm
   - Frontend calls `POST /api/auth/login`
   - On success:
     - Store JWT token in secure storage
     - Set authentication state
     - Redirect to dashboard
   - On failure:
     - Display error message
     - Clear password field

2. **Session Management**:
   - Include auth token in Authorization header
   - Implement auto-refresh for expired tokens
   - Handle unauthorized responses (redirect to login)
   - Clear tokens on logout

### Static Quiz Creation Flow

1. **Create Quiz**:
   - Submit basic quiz details via `POST /api/quizzes`
   - Receive quiz ID in response
   - For each question:
     - Submit via `POST /api/quizzes/:quizId/questions`
   - Update quiz settings via `PUT /api/quizzes/:quizId`
   - Publish quiz via `POST /api/quizzes/:quizId/publish`
   - Receive share code in response

2. **Edit Quiz**:
   - Load quiz data via `GET /api/quizzes/:quizId`
   - Update questions via respective APIs
   - Save changes via `PUT` endpoints

### Live Quiz Flow

1. **Host Setup**:
   - Create live quiz via same flow as static quiz
   - Configure live-specific settings
   - Initialize live room via `POST /api/live-quizzes`
   - Receive room code in response
   - Connect to WebSocket with room code
   - Listen for participant joins

2. **Participant Setup**:
   - Enter room code
   - Validate room via `GET /api/live-quizzes/:roomId`
   - Connect to WebSocket with room code
   - Send `join:room` event
   - Wait for `quiz:start` event

3. **Live Quiz Operation**:
   - Host sends `host:start-quiz`
   - Server broadcasts `quiz:start`
   - Server pushes first question via `quiz:question`
   - Server starts timer updates via `quiz:timer`
   - Participants submit answers via `submit:answer`
   - After question concludes, server sends `quiz:leaderboard`
   - Host advances via `host:next-question`
   - Process repeats until quiz completion
   - Server sends `quiz:end` with final results

### Result Handling

1. **Static Quiz**:
   - Submit all answers at once via `POST /api/quizzes/:quizId/submit`
   - Receive results immediately in response
   - Display results page with breakdown

2. **Live Quiz**:
   - Results processed after each question
   - Final results received via `quiz:end` event
   - Additionally accessible via `GET /api/live-quizzes/:roomId/results`


