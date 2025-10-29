import React, { useState } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  signOut
} from 'aws-amplify/auth';
// Authentication Modal Component
export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'confirm', 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmCode: '',
    newPassword: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: code and new password

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const showMessage = (text, type = '') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    if (formData.password.length < 8) {
      showMessage('Password must be at least 8 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: { email: formData.email },
          autoSignIn: false,
        },
      });
      
      if (result.isSignUpComplete) {
        showMessage('Sign up complete. You can sign in.', 'success');
        setAuthMode('login');
      } else {
        showMessage('Verification code sent to your email. Please confirm.', 'success');
        setAuthMode('confirm');
      }
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Sign-up failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await signIn({ username: formData.email, password: formData.password });
      const user = await getCurrentUser();
      showMessage('Login successful!', 'success');
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 1500);
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.confirmCode) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({ 
        username: formData.email, 
        confirmationCode: formData.confirmCode 
      });
      showMessage('Email verified. You can now sign in.', 'success');
      setAuthMode('login');
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Confirmation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showMessage('Please enter your email', 'error');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ username: formData.email });
      showMessage('Password reset code sent to your email.', 'success');
      setForgotStep(2);
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Failed to send reset code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.confirmCode || !formData.newPassword) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    if (formData.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await confirmResetPassword({
        username: formData.email,
        confirmationCode: formData.confirmCode,
        newPassword: formData.newPassword
      });
      showMessage('Password reset successful! You can now login.', 'success');
      setAuthMode('login');
      setForgotStep(1);
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Password reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      showMessage('Please enter your email first', 'error');
      return;
    }

    setLoading(true);
    try {
      await resendSignUpCode({ username: formData.email });
      showMessage('Verification code resent. Check your email.', 'success');
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Resend failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {authMode === 'login' && 'Sign In'}
            {authMode === 'signup' && 'Sign Up'}
            {authMode === 'confirm' && 'Confirm Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'error' ? 'bg-red-100 text-red-700' : 
              message.type === 'success' ? 'bg-green-100 text-green-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-blue-600 hover:underline mr-4"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min 8 characters)"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-600 hover:underline"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {/* Confirm Form */}
          {authMode === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="confirmCode"
                  placeholder="Confirmation Code"
                  value={formData.confirmCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Confirming...' : 'Confirm Account'}
              </button>
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-blue-600 hover:underline block"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-gray-600 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {authMode === 'forgot' && (
            <form onSubmit={forgotStep === 1 ? handleForgotPassword : handleConfirmForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {forgotStep === 2 && (
                <>
                  <div>
                    <input
                      type="text"
                      name="confirmCode"
                      placeholder="Confirmation Code"
                      value={formData.confirmCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="New Password (min 8 characters)"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : forgotStep === 1 ? 'Send Reset Code' : 'Reset Password'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setForgotStep(1);
                  }}
                  className="text-gray-600 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Auth Hook
export function useAuth() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  React.useEffect(() => {
    getCurrentUser().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  return {
    user,
    showAuthModal,
    setShowAuthModal,
    handleSignOut,
    handleAuthSuccess
  };
}
