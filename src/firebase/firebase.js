import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBLwf6XxFBGvEV55DXO0ciQS08dJR729U",
  authDomain: "dailycn-b2e26.firebaseapp.com",
  projectId: "dailycn-b2e26",
  storageBucket: "dailycn-b2e26.firebasestorage.app",
  messagingSenderId: "380552156742",
  appId: "1:380552156742:web:e668aff9b548bada145c47",
  measurementId: "G-KMWK23RBS0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
