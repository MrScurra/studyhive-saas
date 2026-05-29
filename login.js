// StudyHive Login
// Firebase email/password and Google authentication handlers.
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  browserLocalPersistence,
  setPersistence
} from './firebase-config.js';

console.log('Login script loaded');
console.log('Auth object:', auth);

const API_BASE_URL = (window.StudyHiveConfig?.apiBaseUrl || 'http://localhost:5000/api').replace(/\/$/, '');
const TWO_FACTOR_SESSION_PREFIX = 'studyhive:2fa:verified:';

const loginView = document.getElementById('loginView');
const signupView = document.getElementById('signupView');
const otpView = document.getElementById('otpView');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const googleBtn = document.getElementById('googleBtn');
const googleBtnSignup = document.getElementById('googleBtnSignup');
const loginForm = document.querySelector('#loginView form');
const signupForm = document.querySelector('#signupView form');
const otpForm = document.getElementById('otpForm');
const otpCodeInput = document.getElementById('otpCode');
const otpEmailMessage = document.getElementById('otpEmailMessage');
const otpResendBtn = document.getElementById('otpResendBtn');
const otpUseDifferentAccountBtn = document.getElementById('otpUseDifferentAccountBtn');

console.log('DOM elements:', {
  loginView,
  signupView,
  otpView,
  showSignup,
  showLogin,
  googleBtn,
  googleBtnSignup,
  loginForm,
  signupForm,
  otpForm
});

let isLoading = false;
let pendingOtpUser = null;
let pendingSignupName = '';

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

function getTwoFactorSessionKey(userId) {
  return `${TWO_FACTOR_SESSION_PREFIX}${userId}`;
}

function markTwoFactorVerified(userId) {
  if (!userId) return;
  sessionStorage.setItem(getTwoFactorSessionKey(userId), 'true');
}

function clearTwoFactorVerified(userId) {
  if (!userId) return;
  sessionStorage.removeItem(getTwoFactorSessionKey(userId));
}

function isTwoFactorVerified(userId) {
  return Boolean(userId && sessionStorage.getItem(getTwoFactorSessionKey(userId)) === 'true');
}

function clearStoredUserSession() {
  [
    'userId',
    'userName',
    'userFullName',
    'userEmail',
    'userAvatar'
  ].forEach((key) => localStorage.removeItem(key));
}

function getProviderIds(user = auth.currentUser) {
  return (user?.providerData || [])
    .map((provider) => provider?.providerId)
    .filter(Boolean);
}

async function getCurrentSignInProvider(user = auth.currentUser) {
  if (!user) return '';

  try {
    const tokenResult = await user.getIdTokenResult();
    return tokenResult?.signInProvider
      || tokenResult?.claims?.firebase?.sign_in_provider
      || '';
  } catch (error) {
    console.warn('Could not resolve auth provider from ID token:', error);
    return '';
  }
}

async function requiresEmailOtp(user = auth.currentUser) {
  if (!user) return false;

  const signInProvider = await getCurrentSignInProvider(user);
  const providerIds = getProviderIds(user);

  if (signInProvider === 'google.com') return false;
  if (signInProvider === 'password') return true;

  return providerIds.includes('password');
}

async function getFirebaseAuthHeaders(user = auth.currentUser) {
  if (!user) {
    throw new Error('Please sign in again before verifying your code.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await user.getIdToken()}`
  };
}

async function parseApiResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

function getOtpErrorMessage(error) {
  let message = error?.message || 'Verification failed. Please try again.';

  if (Number.isFinite(error?.retryAfterSeconds)) {
    message += ` Try again in ${error.retryAfterSeconds} seconds.`;
  }

  if (Number.isFinite(error?.attemptsRemaining)) {
    const label = error.attemptsRemaining === 1 ? 'attempt' : 'attempts';
    message += ` ${error.attemptsRemaining} ${label} left.`;
  }

  return message;
}

async function sendOtpToCurrentUser(user = auth.currentUser) {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: await getFirebaseAuthHeaders(user),
    body: JSON.stringify({})
  });
  const data = await parseApiResponse(response);

  if (!response.ok) {
    const error = new Error(data.error || 'Unable to send verification code.');
    error.status = response.status;
    error.retryAfterSeconds = data.retryAfterSeconds;
    throw error;
  }

  return data;
}

async function verifyOtpForCurrentUser(otpCode, user = auth.currentUser) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: await getFirebaseAuthHeaders(user),
    body: JSON.stringify({ otp: otpCode })
  });
  const data = await parseApiResponse(response);

  if (!response.ok) {
    const error = new Error(data.error || 'Invalid verification code.');
    error.status = response.status;
    error.attemptsRemaining = data.attemptsRemaining;
    throw error;
  }

  return data;
}

function redirectToDashboard() {
  console.log('Redirecting to dashboard');
  window.location.href = 'dashboard.html';
}

function showSignupView() {
  console.log('Showing signup view');
  loginView.classList.add('hidden');
  signupView.classList.remove('hidden');
  otpView?.classList.add('hidden');
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
  otpView?.classList.add('hidden');
  clearFormErrors();

  // Scroll to top to ensure form is visible
  setTimeout(() => {
    document.querySelector('.login-card')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function showOtpView(user = auth.currentUser, message = '', messageType = 'success') {
  pendingOtpUser = user || pendingOtpUser;

  loginView.classList.add('hidden');
  signupView.classList.add('hidden');
  otpView?.classList.remove('hidden');

  if (otpEmailMessage) {
    const email = pendingOtpUser?.email || 'your email';
    otpEmailMessage.textContent = `Enter the 6-digit code sent to ${email}.`;
  }

  clearFormErrors();

  if (message) {
    showOtpMessage(message, messageType);
  }

  setTimeout(() => {
    otpCodeInput?.focus();
  }, 100);
}

function showOtpMessage(message, type = 'error') {
  const errorContainer = document.getElementById('otpErrorContainer');

  if (!errorContainer) return;

  errorContainer.innerHTML = '';

  if (!message) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
  messageDiv.textContent = message;
  errorContainer.appendChild(messageDiv);
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
  let currentView = loginView;

  if (!otpView?.classList.contains('hidden')) {
    currentView = otpView;
  } else if (loginView.classList.contains('hidden')) {
    currentView = signupView;
  }

  const errorContainerId = currentView.id === 'loginView'
    ? 'loginErrorContainer'
    : currentView.id === 'otpView'
      ? 'otpErrorContainer'
      : 'signupErrorContainer';
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
  errorContainer.appendChild(errorDiv);
  setTimeout(() => {
    if (errorContainer.contains(errorDiv)) {
      errorDiv.remove();
    }
  }, 5000);
}

function clearFormErrors() {
  const loginErrorContainer = document.getElementById('loginErrorContainer');
  const signupErrorContainer = document.getElementById('signupErrorContainer');
  const otpErrorContainer = document.getElementById('otpErrorContainer');
  if (loginErrorContainer) loginErrorContainer.innerHTML = '';
  if (signupErrorContainer) signupErrorContainer.innerHTML = '';
  if (otpErrorContainer) otpErrorContainer.innerHTML = '';
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
      pendingOtpUser = null;
      pendingSignupName = '';
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

async function handleLogin(event) {
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
  let loggedInUser = null;

  try {
    await setupPersistentAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    loggedInUser = result.user;
    pendingSignupName = '';
    pendingOtpUser = loggedInUser;
    clearTwoFactorVerified(loggedInUser.uid);
    console.log('Login successful:', loggedInUser.email);

    showOtpView(loggedInUser, 'Sending your verification code...', 'success');
    await sendOtpToCurrentUser(loggedInUser);
    showOtpMessage('Verification code sent. It expires in 5 minutes.', 'success');
  } catch (error) {
    console.error('Login error:', error);

    if (loggedInUser) {
      showOtpView(loggedInUser);
      showOtpMessage(getOtpErrorMessage(error), 'error');
    } else {
      handleFirebaseError(error);
    }
  } finally {
    setLoading(loginBtn, false);
    isLoading = false;
  }
}

async function handleSignup(event) {
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
  let signedUpUser = null;

  try {
    await setupPersistentAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    signedUpUser = userCredential.user;
    console.log('Signup successful:', signedUpUser.email);

    await updateProfile(signedUpUser, {
      displayName: name
    });

    pendingSignupName = name;
    pendingOtpUser = signedUpUser;
    clearTwoFactorVerified(signedUpUser.uid);

    showOtpView(signedUpUser, 'Sending your verification code...', 'success');
    await sendOtpToCurrentUser(signedUpUser);
    showOtpMessage('Verification code sent. It expires in 5 minutes.', 'success');
  } catch (error) {
    console.error('Signup error:', error);

    if (signedUpUser) {
      showOtpView(signedUpUser);
      showOtpMessage(getOtpErrorMessage(error), 'error');
    } else {
      handleFirebaseError(error);
    }
  } finally {
    setLoading(signupBtn, false);
    isLoading = false;
  }
}

async function handleOtpVerification(event) {
  event.preventDefault();

  if (isLoading) {
    return;
  }

  const user = pendingOtpUser || auth.currentUser;
  const otpCode = otpCodeInput?.value.trim() || '';
  const verifyBtn = document.getElementById('otpVerifyBtn');

  clearFormErrors();

  if (!user) {
    showOtpMessage('Please sign in again before verifying your code.', 'error');
    return;
  }

  if (!/^\d{6}$/.test(otpCode)) {
    showOtpMessage('Enter the 6-digit verification code.', 'error');
    otpCodeInput?.focus();
    return;
  }

  isLoading = true;
  setLoading(verifyBtn, true);

  try {
    await verifyOtpForCurrentUser(otpCode, user);
    markTwoFactorVerified(user.uid);
    saveUserSession(user, pendingSignupName);
    pendingOtpUser = null;
    pendingSignupName = '';
    redirectToDashboard();
  } catch (error) {
    showOtpMessage(getOtpErrorMessage(error), 'error');
    otpCodeInput?.focus();
  } finally {
    setLoading(verifyBtn, false);
    isLoading = false;
  }
}

async function handleResendOtp(event) {
  event.preventDefault();

  if (isLoading) {
    return;
  }

  const user = pendingOtpUser || auth.currentUser;

  if (!user) {
    showOtpMessage('Please sign in again before requesting a new code.', 'error');
    return;
  }

  isLoading = true;
  setLoading(otpResendBtn, true);
  showOtpMessage('Sending a new verification code...', 'success');

  try {
    await sendOtpToCurrentUser(user);
    showOtpMessage('A new verification code was sent. It expires in 5 minutes.', 'success');
  } catch (error) {
    showOtpMessage(getOtpErrorMessage(error), 'error');
  } finally {
    setLoading(otpResendBtn, false);
    isLoading = false;
  }
}

async function handleUseDifferentAccount(event) {
  event.preventDefault();

  if (isLoading) {
    return;
  }

  isLoading = true;
  setLoading(otpUseDifferentAccountBtn, true);

  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      clearTwoFactorVerified(currentUser.uid);
      await signOut(auth);
    }
  } catch (error) {
    console.error('Sign out while changing account failed:', error);
  }

  pendingOtpUser = null;
  pendingSignupName = '';
  clearStoredUserSession();
  if (otpCodeInput) otpCodeInput.value = '';
  showLoginView();
  setLoading(otpUseDifferentAccountBtn, false);
  isLoading = false;
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

  if (otpForm) {
    console.log('Attaching otpForm listener');
    otpForm.addEventListener('submit', handleOtpVerification);
  }

  if (otpCodeInput) {
    otpCodeInput.addEventListener('input', () => {
      otpCodeInput.value = otpCodeInput.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  if (otpResendBtn) {
    otpResendBtn.addEventListener('click', handleResendOtp);
  }

  if (otpUseDifferentAccountBtn) {
    otpUseDifferentAccountBtn.addEventListener('click', handleUseDifferentAccount);
  }

  console.log('Event listeners setup complete');
}

function init() {
  console.log('Initializing login page...');
  setupEventListeners();

  console.log('Checking auth state...');
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('User already logged in:', user.email);

      if (isLoading) {
        return;
      }

      const needsOtp = await requiresEmailOtp(user);

      if (needsOtp && !isTwoFactorVerified(user.uid)) {
        pendingOtpUser = user;
        showOtpView(user);
        return;
      }

      saveUserSession(user);

      if (!needsOtp || isTwoFactorVerified(user.uid)) {
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
