import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const QuestionBankPage = () => {
  const { user } = useAuth();
  
  // State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/questions');
        
        if (data.success) {
          setQuestions(data.data || []);
        } else {
          setError('Failed to load questions');
          toast.error('Failed to load questions');
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Error loading questions');
        toast.error('Error loading questions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);
  
  // Placeholder for question bank page
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <Button>Create Question</Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-100">
          <p className="text-red-600">{error}</p>
        </Card>
      ) : (
        <>
          {questions.length === 0 ? (
            <Card className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Your Question Bank is Empty</h2>
              <p className="text-gray-600 mb-6">
                Start by creating questions that you can reuse in multiple quizzes.
              </p>
              <Button>Create Your First Question</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((question) => (
                <Card key={question._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-semibold">{question.questionText}</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {question.category || 'Uncategorized'}
                      </span>
                      <span className="ml-2 text-gray-500">
                        {question.difficulty || 'Not set'}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {question.options && question.options.map((option, index) => (
                        <div 
                          key={index}
                          className={`border p-2 text-sm rounded ${
                            option.isCorrect 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          {option.text}
                          {option.isCorrect && (
                            <span className="ml-1 text-xs text-green-600">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="secondary" size="small">Edit</Button>
                      <Button variant="danger" size="small">Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionBankPage; 