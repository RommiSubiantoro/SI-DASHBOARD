import { initializeApp } from "firebase/app";
import { getFirestore } from '@firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOc1dZQmXPlP_VhfhJTwbYJAQEAfoY9jA",
  authDomain: "si-dashboard-7203c.firebaseapp.com",
  projectId: "si-dashboard-7203c",
  storageBucket: "si-dashboard-7203c.firebasestorage.app",
  messagingSenderId: "357942257061",
  appId: "1:357942257061:web:2bf7ff2efbc44e34cfb44c",
  measurementId: "G-T3E34E1LXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export default app;

export { auth, firestore, analytics, storage };  