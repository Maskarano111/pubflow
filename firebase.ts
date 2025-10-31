import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyCfSFL9wU-VrzyVant_VbxScVLreqjknt0",
  authDomain: "pubflow-app.firebaseapp.com",
  projectId: "pubflow-app",
  storageBucket: "pubflow-app.appspot.com",
  messagingSenderId: "344114663090",
  appId: "1:344114663090:web:8c0f4b3b0f8b925e3b8f6f",
  measurementId: "G-VZ88L275PP"
};

// Initialize and export only the core Firebase app
export const app = initializeApp(firebaseConfig);
