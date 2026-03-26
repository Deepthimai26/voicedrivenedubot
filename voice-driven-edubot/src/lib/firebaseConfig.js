// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPVCJuHT3YqA9kWJZ5uT_snMv3wMI6mj0",
  authDomain: "voice-driven-edubot.firebaseapp.com",
  projectId: "voice-driven-edubot",
  storageBucket: "voice-driven-edubot.firebasestorage.app",
  messagingSenderId: "35327540994",
  appId: "1:35327540994:web:8aa62a0dd1393ec4380c1b",
  measurementId: "G-BXZ4EKF6MR"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
