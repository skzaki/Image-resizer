# Image Resizer with Authentication

This project is an enhanced version of the image resizer with comprehensive authentication features using AWS Cognito.

## Features

### Authentication System
- **User Registration**: Sign up with email and password
- **Email Verification**: Automatic email confirmation for new accounts
- **User Login**: Secure authentication with AWS Cognito
- **Password Reset**: Forgot password functionality with email verification
- **User Session Management**: Persistent login sessions
- **Secure Logout**: Proper session termination

### Image Processing
- Batch image resizing
- Multiple format support (JPG, PNG, WEBP)
- Aspect ratio preservation
- Quality control
- Cloud storage integration with AWS S3

## Authentication Flow

### 1. Sign Up Process
1. User enters email and password
2. System validates password strength (minimum 8 characters)
3. AWS Cognito sends verification email
4. User confirms account with verification code
5. Account is activated and ready for login

### 2. Login Process
1. User enters email and password
2. AWS Cognito validates credentials
3. User session is established
4. Access to cloud storage features is granted

### 3. Password Reset Process
1. User requests password reset with email
2. AWS Cognito sends reset code to email
3. User enters reset code and new password
4. Password is updated and user can login

## Technical Implementation

### Components
- `AuthModal.jsx`: Main authentication modal component
- `useAuth`: Custom hook for authentication state management
- Enhanced `App.jsx`: Main application with integrated auth

### AWS Services Used
- **AWS Cognito**: User authentication and management
- **AWS S3**: Cloud storage for resized images
- **AWS Amplify**: SDK for seamless integration

### Security Features
- Password strength validation
- Secure token-based authentication
- Automatic session management
- Protected cloud storage access

## Usage

1. **For New Users**:
   - Click "Sign in" button
   - Switch to "Sign Up" tab
   - Enter email and password
   - Check email for verification code
   - Confirm account and login

2. **For Existing Users**:
   - Click "Sign in" button
   - Enter email and password
   - Access full features including cloud storage

3. **Password Reset**:
   - Click "Forgot Password?" link
   - Enter email address
   - Check email for reset code
   - Enter code and new password

## Benefits of Authentication

- **Cloud Storage**: Save resized images to AWS S3
- **Cross-Device Access**: Access your images from anywhere
- **Secure Storage**: Private cloud storage for your files
- **User Management**: Track and manage your resized images
- **Enhanced Features**: Unlock premium functionality

The authentication system provides a seamless user experience while maintaining security best practices with AWS Cognito integration.
