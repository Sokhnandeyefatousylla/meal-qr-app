# 🚀 Guide de déploiement — QR Repas Cérémonie

## Architecture
- **Frontend** : React (Vite)
- **Base de données** : Firebase Realtime Database (temps réel, multi-utilisateurs)
- **Hébergement** : Vercel (gratuit)

---

## ÉTAPE 1 — Créer le projet Firebase (base de données)

1. Allez sur https://console.firebase.google.com
2. Cliquez **"Ajouter un projet"** → donnez un nom (ex: `repas-ceremonie`)
3. Désactivez Google Analytics (optionnel) → **Créer le projet**

### Activer la base de données
4. Dans le menu gauche : **Build → Realtime Database**
5. Cliquez **"Créer une base de données"**
6. Choisissez la région la plus proche (ex: europe-west1)
7. Mode de démarrage : **"Commencer en mode test"** → Activer

### Récupérer la configuration
8. Icône ⚙️ (Paramètres) → **Paramètres du projet**
9. Onglet **"Vos applications"** → cliquez l'icône **</>** (Web)
10. Donnez un nom à l'app → **Enregistrer**
11. Copiez le bloc `firebaseConfig` qui apparaît

---

## ÉTAPE 2 — Configurer l'application

1. Ouvrez le fichier `src/firebase.js`
2. Remplacez les valeurs avec votre configuration :

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← votre vraie valeur
  authDomain: "mon-projet.firebaseapp.com",
  databaseURL: "https://mon-projet-default-rtdb.firebaseio.com",
  projectId: "mon-projet",
  storageBucket: "mon-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
}
```

---

## ÉTAPE 3 — Installer et tester en local

```bash
# Dans le dossier du projet
npm install
npm run dev
```

Ouvrez http://localhost:5173 dans votre navigateur.

---

## ÉTAPE 4 — Déployer sur Vercel (accès depuis n'importe quel téléphone)

### Option A : Via GitHub (recommandé)
1. Créez un compte sur https://github.com (si pas déjà fait)
2. Créez un nouveau dépôt et uploadez le dossier du projet
3. Allez sur https://vercel.com → **"Add New Project"**
4. Connectez votre GitHub → sélectionnez le dépôt
5. Framework : **Vite** (auto-détecté)
6. Cliquez **Deploy**
7. ✅ Votre app est en ligne sur `https://votre-projet.vercel.app`

### Option B : Via CLI (ligne de commande)
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## ÉTAPE 5 — Partager l'accès aux scanners

1. Envoyez l'URL Vercel à toutes les personnes qui vont scanner
2. Chacune ouvre l'URL sur son téléphone
3. Ils voient tous les mêmes données en temps réel grâce à Firebase
4. Tous peuvent scanner simultanément !

---

## Utilisation pendant l'événement

### Avant l'événement
- Onglet **Participants** : importez votre fichier Excel ou ajoutez manuellement
- Cliquez **"Imprimer tous les QR"** → imprimez et distribuez les badges

### Pendant l'événement
- Sélectionnez le bon **Jour** et le bon **Repas** en cours
- Cliquez **"Ouvrir la caméra"** pour scanner avec l'appareil photo
- OU connectez un lecteur QR USB/Bluetooth
- Le système bloque automatiquement les doubles scans

### Format Excel pour l'import
| A (Nom)          | B (Email)               |
|------------------|-------------------------|
| Fatima Sylla     | fatima@example.com      |
| Mamadou Diallo   | mamadou@example.com     |
| Aïssatou Bah     |                         |

---

## Règles de sécurité Firebase (production)

Dans Firebase Console → Realtime Database → Règles, remplacez par :

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> Pour une sécurité renforcée (optionnel), ajoutez l'authentification Firebase.

---

## Coût
- Firebase : **Gratuit** jusqu'à 1 Go de données et 100 connexions simultanées
- Vercel : **Gratuit** pour les projets personnels
- Total : **0 €** 🎉
