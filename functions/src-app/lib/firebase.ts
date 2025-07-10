import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    getFirestore,
    type Firestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Votre configuration Firebase
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialiser Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialiser Firestore avec la persistance activée directement
let db: Firestore;
if (typeof window !== 'undefined') {
    // Côté client : initialiser avec persistance
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    console.log('Firestore initialisé avec persistance locale');
} else {
    // Côté serveur : initialiser sans persistance
    db = getFirestore(app);
}

// Exporter les services Firebase
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

// Fonction utilitaire pour vérifier l'état de la connexion Internet
export const checkNetworkConnection = () => {
    if (typeof window !== 'undefined') {
        return window.navigator.onLine;
    }
    return true; // Par défaut, supposer connecté dans un environnement serveur
};

// Cette fonction est maintenant obsolète car la persistance est activée lors de l'initialisation
// Conservée pour compatibilité avec le code existant, mais ne fait rien
export const enableOfflineData = async () => {
    // Ne fait rien - la persistance est déjà activée lors de l'initialisation
    console.log('La persistance IndexedDB est déjà activée lors de l\'initialisation');
    return Promise.resolve();
};

export { db };
export default app;