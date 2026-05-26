import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ======================
// TOGGLE LOGIN / SIGNUP
// ======================

const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

showSignup.addEventListener("click", () => {
  loginView.style.display = "none";
  signupView.style.display = "block";
});

showLogin.addEventListener("click", () => {
  signupView.style.display = "none";
  loginView.style.display = "block";
});

// ======================
// EMAIL SIGNUP
// ======================

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    alert("Signup successful!");

    window.location.href = "dashboard.html";

  } catch (error) {
    alert(error.message);
  }
});

// ======================
// EMAIL LOGIN
// ======================

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    alert("Login successful!");

    window.location.href = "dashboard.html";

  } catch (error) {
    alert(error.message);
  }
});

// ======================
// GOOGLE LOGIN
// ======================

const provider = new GoogleAuthProvider();

const googleBtnLogin = document.getElementById("googleBtnLogin");
const googleBtnSignup = document.getElementById("googleBtnSignup");

async function googleLogin() {
  try {
    
    await signInWithPopup(auth, provider);

    window.location.href = "dashboard.html";

  } catch (error) {
    alert(error.message);
  }
}

if (googleBtnLogin) {
  googleBtnLogin.addEventListener("click", googleLogin);
}

if (googleBtnSignup) {
  googleBtnSignup.addEventListener("click", googleLogin);
}