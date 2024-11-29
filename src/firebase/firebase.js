import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDpuppEnJ8SQpxCFuHsh2TK-NwlVMi_k6I",
  authDomain: "riskcalculator-af10e.firebaseapp.com",
  projectId: "riskcalculator-af10e",
  storageBucket: "riskcalculator-af10e.appspot.com",
  messagingSenderId: "414117594648",
  appId: "1:414117594648:web:dee5b536b289687634a56d",
  measurementId: "G-C6DV60JLNK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { auth, db };
