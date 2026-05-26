// StudyHive Login
// Firebase email/password and Google authentication handlers.
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  browserLocalPersistence,
  setPersistence
} from './firebase-config.js';

console.log('Login script loaded');
console.log('Auth object:', auth);

const loginView = document.getElementById('loginView');
const signupView = document.getElementById('signupView');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const googleBtn = document.getElementById('googleBtn');
const googleBtnSignup = document.getElementById('googleBtnSignup');
const loginForm = document.querySelector('#loginView form');
const signupForm = document.querySelector('#signupView form');

console.log('DOM elements:', {
  loginView,
  signupView,
  showSignup,
  showLogin,
  googleBtn,
  googleBtnSignup,
  loginForm,
  signupForm
});

let isLoading = false;

function getDisplayName(user, fallbackName = '') {
  if (fallbackName) return fallbackName;
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return 'StudyHive User';
}

function saveUserSession(user, fallbackName = '') {
  const displayName = getDisplayName(user, fallbackName);
  const avatar = user.photoURL || './frontend/assets/profile-picture/default-profile-picture.webp';

  localStorage.setItem('userId', user.uid);
  localStorage.setItem('userName', displayName);
  localStorage.setItem('userFullName', displayName);
  localStorage.setItem('userEmail', user.email || '');
  localStorage.setItem('userAvatar', avatar);
}

function setupPersistentAuth() {
  return setPersistence(auth, browserLocalPersistence);
}

function redirectToDashboard() {
  console.log('Redirecting to dashboard');
  window.location.href = 'dashboard.html';
}

function showSignupView() {
  console.log('Showing signup view');
  loginView.classList.add('hidden');
  signupView.classList.remove('hidden');
  clearFormErrors();

  // Scroll to top to ensure form is visible
  setTimeout(() => {
    document.querySelector('.login-card')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function showLoginView() {
  console.log('Showing login view');
  signupView.classList.add('hidden');
  loginView.classList.remove('hidden');
  clearFormErrors();

  // Scroll to top to ensure form is visible
  setTimeout(() => {
    document.querySelector('.login-card')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function setLoading(button, isActive) {
  if (!button) return;
  if (isActive) {
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'not-allowed';
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
  }
}

function showError(message) {
  console.log('Showing error:', message);
  const currentView = loginView.classList.contains('hidden') ? signupView : loginView;
  const errorContainerId = currentView.id === 'loginView' ? 'loginErrorContainer' : 'signupErrorContainer';
  const errorContainer = document.getElementById(errorContainerId);

  if (!errorContainer) {
    console.error('Error container not found:', errorContainerId);
    return;
  }

  // Clear previous errors in this container
  errorContainer.innerHTML = '';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    background-color: #fee;
    color: #c00;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    font-size: 14px;
    border-left: 4px solid #c00;
  `;
  setTimeout(() => {
    if (errorContainer.contains(errorDiv)) {
      errorDiv.remove();
    }
  }, 5000);
}

function clearFormErrors() {
  const loginErrorContainer = document.getElementById('loginErrorContainer');
  const signupErrorContainer = document.getElementById('signupErrorContainer');
  if (loginErrorContainer) loginErrorContainer.innerHTML = '';
  if (signupErrorContainer) signupErrorContainer.innerHTML = '';
}

function handleFirebaseError(error) {
  console.error('Firebase error:', error.code, error.message);
  let message = 'Something went wrong with Firebase Authentication.';

  if (error.code === 'auth/email-already-in-use') {
    message = 'Email is already in use. Please log in or use a different email.';
  } else if (error.code === 'auth/weak-password') {
    message = 'Password is too weak. Please use at least 6 characters.';
  } else if (error.code === 'auth/invalid-email') {
    message = 'Invalid email address.';
  } else if (error.code === 'auth/user-not-found') {
    message = 'User not found. Please check your email or sign up.';
  } else if (error.code === 'auth/wrong-password') {
    message = 'Incorrect password. Please try again.';
  } else if (error.code === 'auth/popup-closed-by-user') {
    message = 'Sign-in popup was closed. Please try again.';
  } else if (error.message) {
    message = error.message;
  }

  showError(message);
}

function handleGoogleSignIn(event) {
  console.log('Google sign-in clicked');
  event.preventDefault();

  if (isLoading) {
    console.log('Already loading, ignoring click');
    return;
  }
  isLoading = true;

  const provider = new GoogleAuthProvider();
  const button = event.currentTarget;
  setLoading(button, true);

  console.log('Starting Google sign-in...');
  setupPersistentAuth()
    .then(() => signInWithPopup(auth, provider))
    .then((result) => {
      console.log('Google sign-in successful');
      saveUserSession(result.user);
      // Update loading state before redirect
      setLoading(button, false);
      isLoading = false;
      setTimeout(() => {
        redirectToDashboard();
      }, 500);
    })
    .catch((error) => {
      console.error('Google sign-in error:', error);
      setLoading(button, false);
      isLoading = false;
      handleFirebaseError(error);
    });
}

function handleLogin(event) {
  console.log('Login form submitted');
  event.preventDefault();

  if (isLoading) {
    console.log('Already loading, ignoring submit');
    return;
  }
  isLoading = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const loginBtn = loginForm.querySelector('button[type="submit"]');

  console.log('Login attempt with email:', email);

  clearFormErrors();

  if (!email || !password) {
    showError('Please enter both email and password.');
    isLoading = false;
    return;
  }

  if (!email.includes('@')) {
    showError('Please enter a valid email address.');
    isLoading = false;
    return;
  }

  setLoading(loginBtn, true);

  console.log('Starting login with Firebase...');
  setupPersistentAuth()
    .then(() => signInWithEmailAndPassword(auth, email, password))
    .then((result) => {
      console.log('Login successful:', result.user.email);
      saveUserSession(result.user);
      setLoading(loginBtn, false);
      isLoading = false;
      redirectToDashboard();
    })
    .catch((error) => {
      console.error('Login error:', error);
      setLoading(loginBtn, false);
      isLoading = false;
      handleFirebaseError(error);
    });
}

function handleSignup(event) {
  console.log('Signup form submitted');
  event.preventDefault();

  if (isLoading) {
    console.log('Already loading, ignoring submit');
    return;
  }
  isLoading = true;

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const signupBtn = signupForm.querySelector('button[type="submit"]');

  console.log('Signup attempt with email:', email);

  clearFormErrors();

  if (!name || !email || !password || !confirmPassword) {
    showError('Please complete every field before signing up.');
    isLoading = false;
    return;
  }

  if (!email.includes('@')) {
    showError('Please enter a valid email address.');
    isLoading = false;
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    isLoading = false;
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match. Please check both password fields.');
    isLoading = false;
    return;
  }

  setLoading(signupBtn, true);

  console.log('Starting signup with Firebase...');
  setupPersistentAuth()
    .then(() => createUserWithEmailAndPassword(auth, email, password))
    .then((userCredential) => {
      console.log('Signup successful:', userCredential.user.email);
      return updateProfile(userCredential.user, {
        displayName: name
      }).then(() => userCredential);
    })
    .then((userCredential) => {
      saveUserSession(userCredential.user, name);
      setLoading(signupBtn, false);
      isLoading = false;
      redirectToDashboard();
    })
    .catch((error) => {
      console.error('Signup error:', error);
      setLoading(signupBtn, false);
      isLoading = false;
      handleFirebaseError(error);
    });
}

function setupEventListeners() {
  console.log('Setting up event listeners...');

  if (showSignup) {
    console.log('Attaching showSignup listener');
    showSignup.addEventListener('click', showSignupView);
  }

  if (showLogin) {
    console.log('Attaching showLogin listener');
    showLogin.addEventListener('click', showLoginView);
  }

  if (googleBtn) {
    console.log('Attaching googleBtn listener');
    googleBtn.addEventListener('click', handleGoogleSignIn);
  }

  if (googleBtnSignup) {
    console.log('Attaching googleBtnSignup listener');
    googleBtnSignup.addEventListener('click', handleGoogleSignIn);
  }

  if (loginForm) {
    console.log('Attaching loginForm listener');
    loginForm.addEventListener('submit', handleLogin);
  }

  if (signupForm) {
    console.log('Attaching signupForm listener');
    signupForm.addEventListener('submit', handleSignup);
  }

  console.log('Event listeners setup complete');
}

function init() {
  console.log('Initializing login page...');
  setupEventListeners();

  console.log('Checking auth state...');
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User already logged in:', user.email);
      saveUserSession(user);

      if (!isLoading) {
        redirectToDashboard();
      }
    } else {
      console.log('No user logged in');
    }
  });

  console.log('Initialization complete');
}

// Ensure DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
