// ⚠️  REMPLISSEZ VOS INFORMATIONS FIREBASE ICI
// Créez un projet sur https://console.firebase.google.com
// Puis allez dans : Paramètres du projet → Vos applications → Config

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  databaseURL: "https://VOTRE_PROJECT-default-rtdb.firebaseio.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
