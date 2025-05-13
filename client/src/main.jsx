import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { QuizProvider } from './context/QuizContext'
import { LiveQuizProvider } from './context/LiveQuizContext'
import { ToastProvider } from './components/ErrorHandling/ToastContainer'
import { ErrorProvider } from './context/ErrorContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorProvider>
      <ToastProvider position="bottom-right" autoCloseDelay={5000}>
        <AuthProvider>
          <QuizProvider>
            <LiveQuizProvider>
              <App />
              <ToastContainer 
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </LiveQuizProvider>
          </QuizProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorProvider>
  </React.StrictMode>,
)
