// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_--Emhb4j6CtyQNRE6pIbislKfmntuiI",
  authDomain: "bhai-33c2c.firebaseapp.com",
  projectId: "bhai-33c2c",
  storageBucket: "bhai-33c2c.firebasestorage.app",
  messagingSenderId: "413685903653",
  appId: "1:413685903653:web:02bc0328e8af00b6faeacc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default db;