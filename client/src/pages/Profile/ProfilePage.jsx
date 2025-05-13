import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useError } from '../../context/ErrorContext';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../utils/debug';

// Create logger for profile page
const logger = createLogger('profile');

const ProfilePage = () => {
  const { user, updateUser, DEBUG_enableDebugMode, DEBUG_disableDebugMode } = useAuth();
  const { isDebugMode, toggleDebugMode } = useError();
  
  // State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data } = await axios.put('/api/users/profile', {
        name: formData.name
      });
      
      if (data.success) {
        toast.success('Profile updated successfully');
        
        // Update user context
        updateUser({
          ...user,
          name: formData.name
        });
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!formData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data } = await axios.put('/api/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (data.success) {
        toast.success('Password changed successfully');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      
      if (err.response && err.response.data) {
        toast.error(err.response.data.message || 'Error changing password');
      } else {
        toast.error('Error changing password');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If no user, show loading
  if (!user) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Basic Profile */}
        <div className="md:col-span-2">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email cannot be changed
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                >
                  Update Profile
                </Button>
              </div>
            </form>
          </Card>
          
          {/* Password Change Section */}
          <Card className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
        
        {/* Right Column - Stats & Info */}
        <div className="md:col-span-1">
          <Card>
            <div className="text-center mb-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-gray-700 text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold mt-2">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Account Information</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="capitalize">{user.role || 'user'}</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t mt-4 pt-4">
              <h3 className="font-medium mb-2">Quiz Statistics</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Quizzes Created</span>
                  <span>0</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Quizzes Taken</span>
                  <span>0</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Avg. Score</span>
                  <span>-</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Advanced Debugging Options */}
      <Card className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Developer Options</h2>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Debug Mode</h3>
              <p className="text-sm text-gray-500">
                Enable detailed logging and debugging tools
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isDebugMode}
                onChange={() => {
                  logger.info(`${isDebugMode ? 'Disabling' : 'Enabling'} debug mode`);
                  if (isDebugMode) {
                    DEBUG_disableDebugMode();
                  } else {
                    DEBUG_enableDebugMode();
                  }
                }}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-xs text-gray-500">
            Warning: Debug mode will expose additional information and tools that are intended for developers. 
            This mode may impact performance and should only be used for troubleshooting.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage; 