import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBi4FN2WTHcugYxWkHakKjBVoZnxcXNslw",
  authDomain: "repas-ceremonie.firebaseapp.com",
  databaseURL: "https://repas-ceremonie-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "repas-ceremonie",
  storageBucket: "repas-ceremonie.firebasestorage.app",
  messagingSenderId: "910676974946",
  appId: "1:910676974946:web:2c35f9b4c57466e85ea03b"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)