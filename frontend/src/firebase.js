import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'placeholder_key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'placeholder_project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'placeholder_app_id'
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.warn('Firebase initialization failed:', error.message);
  // Create a mock Firebase app for development
  app = {
    name: 'mock-app',
    options: firebaseConfig
  };
}

// Initialize Firebase Authentication and get a reference to the service
let auth;
let db;

try {
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase services initialization failed:', error.message);
  // Create mock auth and db for development
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    },
    signOut: async () => {},
    signInWithEmailAndPassword: async () => {},
    signInWithPopup: async () => {}
  };
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, toDict: () => ({}) }),
        set: async () => {},
        update: async () => {}
      })
    })
  };
}

export { auth, db };

export default app; 