import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7dkRi0NrcXnfFcdX5j4gVDVEJaXDzqj0",
  authDomain: "pattuglie-db.firebaseapp.com",
  projectId: "pattuglie-db",
  storageBucket: "pattuglie-db.firebasestorage.app",
  messagingSenderId: "622253524535",
  appId: "1:622253524535:web:be3ee7e93d0ba55d9da1b2",
  measurementId: "G-G14KGK6Q4Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 