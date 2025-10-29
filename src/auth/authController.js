// Authentication UI Controller
import { 
  signUpUser, 
  confirmUser, 
  loginUser, 
  startForgotPassword, 
  confirmForgotPasswordUser, 
  logoutUser, 
  getCurrentUserInfo 
} from '../auth/auth.js';

// Global state for authentication
let authState = {
  isLoggedIn: false,
  currentUser: null,
  forgotPasswordStep: 1 // 1: email, 2: code and new password
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupAuthEventListeners();
});

// Check if user is already logged in
async function checkAuthStatus() {
  try {
    const result = await getCurrentUserInfo();
    if (result.success && result.user) {
      authState.isLoggedIn = true;
      authState.currentUser = result.user;
      showUserInfo();
      hideAuthModal();
    } else {
      showLoginButton();
    }
  } catch (error) {
    console.log('No user logged in');
    showLoginButton();
  }
}

// Setup event listeners
function setupAuthEventListeners() {
  // Add login button to main app
  const loginBtn = document.createElement('button');
  loginBtn.id = 'main-login-btn';
  loginBtn.className = 'login-btn';
  loginBtn.textContent = 'Login';
  loginBtn.onclick = showAuthModal;
  
  // Add to main container or header
  const mainContainer = document.querySelector('#app') || document.body;
  if (mainContainer && !document.getElementById('main-login-btn')) {
    mainContainer.appendChild(loginBtn);
  }
}

// Show authentication modal
function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'block';
    showLogin();
  }
}

// Close authentication modal
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Show login section
function showLogin() {
  hideAllAuthSections();
  document.getElementById('auth-section').style.display = 'block';
  authState.forgotPasswordStep = 1;
}

// Show confirmation section
function showConfirm() {
  hideAllAuthSections();
  document.getElementById('confirm-section').style.display = 'block';
}

// Show forgot password section
function showForgotPassword() {
  hideAllAuthSections();
  document.getElementById('forgot-section').style.display = 'block';
  authState.forgotPasswordStep = 1;
  
  // Reset forgot password inputs
  document.getElementById('forgot-code').style.display = 'none';
  document.getElementById('new-password').style.display = 'none';
  document.getElementById('confirm-reset-btn').style.display = 'none';
}

// Hide all authentication sections
function hideAllAuthSections() {
  const sections = ['auth-section', 'confirm-section', 'forgot-section'];
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'none';
    }
  });
}

// Hide authentication modal
function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Show user info when logged in
function showUserInfo() {
  const userInfo = document.getElementById('user-info');
  const userEmailDisplay = document.getElementById('user-email-display');
  const loginBtn = document.getElementById('main-login-btn');
  
  if (userInfo) {
    userInfo.style.display = 'block';
  }
  
  if (userEmailDisplay && authState.currentUser) {
    userEmailDisplay.textContent = authState.currentUser.username || 'User';
  }
  
  if (loginBtn) {
    loginBtn.style.display = 'none';
  }
}

// Show login button when not logged in
function showLoginButton() {
  const userInfo = document.getElementById('user-info');
  const loginBtn = document.getElementById('main-login-btn');
  
  if (userInfo) {
    userInfo.style.display = 'none';
  }
  
  if (loginBtn) {
    loginBtn.style.display = 'block';
  }
}

// Handle sign up
async function signUpUser() {
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  const messageEl = document.getElementById('auth-message');
  
  if (!email || !password) {
    showMessage(messageEl, 'Please fill in all fields', 'error');
    return;
  }
  
  if (password.length < 8) {
    showMessage(messageEl, 'Password must be at least 8 characters long', 'error');
    return;
  }
  
  showMessage(messageEl, 'Signing up...', '');
  
  const result = await signUpUser(email, password);
  
  if (result.success) {
    showMessage(messageEl, result.message, 'success');
    // Pre-fill email in confirm section
    document.getElementById('confirm-email').value = email;
    setTimeout(() => {
      showConfirm();
    }, 2000);
  } else {
    showMessage(messageEl, result.message, 'error');
  }
}

// Handle login
async function loginUser() {
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  const messageEl = document.getElementById('auth-message');
  
  if (!email || !password) {
    showMessage(messageEl, 'Please fill in all fields', 'error');
    return;
  }
  
  showMessage(messageEl, 'Logging in...', '');
  
  const result = await loginUser(email, password);
  
  if (result.success) {
    showMessage(messageEl, result.message, 'success');
    authState.isLoggedIn = true;
    setTimeout(() => {
      hideAuthModal();
      showUserInfo();
      // Reload page or update UI as needed
      location.reload();
    }, 1500);
  } else {
    showMessage(messageEl, result.message, 'error');
  }
}

// Handle confirmation
async function confirmUser() {
  const email = document.getElementById('confirm-email').value;
  const code = document.getElementById('confirm-code').value;
  const messageEl = document.getElementById('confirm-message');
  
  if (!email || !code) {
    showMessage(messageEl, 'Please fill in all fields', 'error');
    return;
  }
  
  showMessage(messageEl, 'Confirming account...', '');
  
  const result = await confirmUser(email, code);
  
  if (result.success) {
    showMessage(messageEl, result.message, 'success');
    setTimeout(() => {
      showLogin();
    }, 2000);
  } else {
    showMessage(messageEl, result.message, 'error');
  }
}

// Handle forgot password start
async function startForgotPassword() {
  const email = document.getElementById('forgot-email').value;
  const messageEl = document.getElementById('forgot-message');
  
  if (!email) {
    showMessage(messageEl, 'Please enter your email', 'error');
    return;
  }
  
  showMessage(messageEl, 'Sending reset code...', '');
  
  const result = await startForgotPassword(email);
  
  if (result.success) {
    showMessage(messageEl, result.message, 'success');
    authState.forgotPasswordStep = 2;
    
    // Show code and new password fields
    document.getElementById('forgot-code').style.display = 'block';
    document.getElementById('new-password').style.display = 'block';
    document.getElementById('confirm-reset-btn').style.display = 'block';
  } else {
    showMessage(messageEl, result.message, 'error');
  }
}

// Handle forgot password confirmation
async function confirmForgotPassword() {
  const email = document.getElementById('forgot-email').value;
  const code = document.getElementById('forgot-code').value;
  const newPassword = document.getElementById('new-password').value;
  const messageEl = document.getElementById('forgot-message');
  
  if (!email || !code || !newPassword) {
    showMessage(messageEl, 'Please fill in all fields', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showMessage(messageEl, 'Password must be at least 8 characters long', 'error');
    return;
  }
  
  showMessage(messageEl, 'Resetting password...', '');
  
  const result = await confirmForgotPasswordUser(email, code, newPassword);
  
  if (result.success) {
    showMessage(messageEl, result.message, 'success');
    setTimeout(() => {
      showLogin();
    }, 2000);
  } else {
    showMessage(messageEl, result.message, 'error');
  }
}

// Handle logout
async function logoutUser() {
  const result = await logoutUser();
  
  if (result.success) {
    authState.isLoggedIn = false;
    authState.currentUser = null;
    showLoginButton();
    hideAuthModal();
    // Reload page or update UI as needed
    location.reload();
  } else {
    console.error('Logout failed:', result.message);
  }
}

// Show message helper
function showMessage(element, message, type) {
  if (element) {
    element.textContent = message;
    element.className = `auth-message ${type}`;
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('auth-modal');
  if (event.target === modal) {
    closeAuthModal();
  }
}

// Export functions for global access
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.showLogin = showLogin;
window.showForgotPassword = showForgotPassword;
window.signUpUser = signUpUser;
window.loginUser = loginUser;
window.confirmUser = confirmUser;
window.startForgotPassword = startForgotPassword;
window.confirmForgotPassword = confirmForgotPassword;
window.logoutUser = logoutUser;
