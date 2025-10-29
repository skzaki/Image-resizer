// Authentication functions using AWS Cognito
import { signUp, confirmSignUp, signIn, forgotPassword, confirmForgotPassword, signOut, getCurrentUser } from 'aws-amplify/auth';

// Sign up function
export async function signUpUser(email, password) {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password: password,
      options: {
        userAttributes: {
          email: email,
        },
        autoSignIn: false
      }
    });
    
    return {
      success: true,
      message: 'Sign up successful! Please check your email for verification code.',
      userId: userId,
      nextStep: nextStep
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      message: error.message || 'Sign up failed. Please try again.'
    };
  }
}

// Confirm sign up function
export async function confirmUser(email, confirmationCode) {
  try {
    const { isSignUpComplete } = await confirmSignUp({
      username: email,
      confirmationCode: confirmationCode
    });
    
    return {
      success: true,
      message: 'Account confirmed successfully! You can now login.',
      isSignUpComplete: isSignUpComplete
    };
  } catch (error) {
    console.error('Confirmation error:', error);
    return {
      success: false,
      message: error.message || 'Confirmation failed. Please check your code and try again.'
    };
  }
}

// Login function
export async function loginUser(email, password) {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password: password
    });
    
    return {
      success: true,
      message: 'Login successful!',
      isSignedIn: isSignedIn,
      nextStep: nextStep
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed. Please check your credentials.'
    };
  }
}

// Forgot password function
export async function startForgotPassword(email) {
  try {
    const { nextStep } = await forgotPassword({
      username: email
    });
    
    return {
      success: true,
      message: 'Password reset code sent to your email.',
      nextStep: nextStep
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send reset code. Please try again.'
    };
  }
}

// Confirm forgot password function
export async function confirmForgotPasswordUser(email, confirmationCode, newPassword) {
  try {
    await confirmForgotPassword({
      username: email,
      confirmationCode: confirmationCode,
      newPassword: newPassword
    });
    
    return {
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    };
  } catch (error) {
    console.error('Confirm forgot password error:', error);
    return {
      success: false,
      message: error.message || 'Password reset failed. Please try again.'
    };
  }
}

// Logout function
export async function logoutUser() {
  try {
    await signOut();
    return {
      success: true,
      message: 'Logged out successfully!'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: error.message || 'Logout failed.'
    };
  }
}

// Get current user function
export async function getCurrentUserInfo() {
  try {
    const user = await getCurrentUser();
    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      user: null
    };
  }
}
