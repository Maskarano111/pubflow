import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfSFL9wU-VrzyVant_VbxScVLreqjknt0",
  authDomain: "pubflow-app.firebaseapp.com",
  projectId: "pubflow-app",
  storageBucket: "pubflow-app.firebasestorage.app",
  messagingSenderId: "483893059685",
  appId: "1:483893059685:web:3e4d1b000e0d6cc176a68c",
  measurementId: "G-VZ88L275PP"
};

// Initialize and export only the core Firebase app
export const app = initializeApp(firebaseConfig);
