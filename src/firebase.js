// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBi4FN2WTHcugYxWkHakKjBVoZnxcXNslw",
  authDomain: "repas-ceremonie.firebaseapp.com",
  databaseURL: "https://repas-ceremonie-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "repas-ceremonie",
  storageBucket: "repas-ceremonie.firebasestorage.app",
  messagingSenderId: "910676974946",
  appId: "1:910676974946:web:2c35f9b4c57466e85ea03b",
  measurementId: "G-Q031939D3F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);