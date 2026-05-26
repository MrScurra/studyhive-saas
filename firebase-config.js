// Import Firebase SDK from CDN (not npm)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  browserLocalPersistence,
  setPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

console.log('Firebase config script loaded');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQXTkhlcnSrbSegUKY4ioWkmKXVi0VWFg",
  authDomain: "study-collab-saas-js.firebaseapp.com",
  projectId: "study-collab-saas-js",
  storageBucket: "study-collab-saas-js.firebasestorage.app",
  messagingSenderId: "395154797682",
  appId: "1:395154797682:web:f2c2e7a1b974ffb9f9beeb"
};

console.log('Firebase config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized successfully');

// Initialize Firebase Authentication
export const auth = getAuth(app);
console.log('Firebase auth initialized successfully');

// Initialize Firestore
export const db = getFirestore(app);
console.log('Firestore initialized successfully');

// Export Firebase Auth functions for use in your app
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  browserLocalPersistence,
  setPersistence,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove
};
