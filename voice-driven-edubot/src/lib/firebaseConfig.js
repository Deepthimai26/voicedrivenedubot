// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "*",
  authDomain: "*",
  projectId: "*t",
  storageBucket: "*",
  messagingSenderId: "*",
  appId: "*",
  measurementId: "*"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
