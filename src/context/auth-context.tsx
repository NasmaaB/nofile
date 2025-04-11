'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    User as FirebaseUser,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthUser extends User {
    displayName?: string;
    uid?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        // L'utilisateur existe déjà dans Firestore
                        const userData = userDoc.data() as User;
                        setUser({
                            ...userData,
                            id: firebaseUser.uid,
                            email: firebaseUser.email || userData.email,
                            displayName: firebaseUser.displayName || userData.firstName || 'Utilisateur',
                            photoURL: firebaseUser.photoURL || userData.photoURL,
                            uid: firebaseUser.uid
                        });

                        // Mettre à jour le lastLogin
                        await updateDoc(userDocRef, {
                            lastLoginAt: serverTimestamp()
                        });
                    } else {
                        // L'utilisateur n'existe pas encore dans Firestore
                        const newUser: AuthUser = {
                            id: firebaseUser.uid,
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            displayName: firebaseUser.displayName || 'Utilisateur',
                            photoURL: firebaseUser.photoURL || '',
                            role: 'staff',
                            createdAt: serverTimestamp() as any,
                            lastLoginAt: serverTimestamp() as any,
                            subscription: 'free'
                        };

                        await setDoc(userDocRef, newUser);
                        setUser(newUser);
                    }
                } catch (err) {
                    console.error('Erreur lors de la récupération des données utilisateur:', err);
                    setError('Erreur lors de la récupération des données utilisateur');
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            setLoading(true);
            setError(null);

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Mettre à jour le profil Firebase
            await updateProfile(firebaseUser, { displayName });

            // Créer le document utilisateur dans Firestore
            const newUser: AuthUser = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: email,
                displayName: displayName,
                firstName: displayName.split(' ')[0],
                lastName: displayName.split(' ').slice(1).join(' '),
                photoURL: firebaseUser.photoURL || '',
                role: 'staff',
                createdAt: serverTimestamp() as any,
                lastLoginAt: serverTimestamp() as any,
                subscription: 'free'
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
        } catch (err: any) {
            console.error('Erreur lors de l\'inscription:', err);

            const errorMessage =
                err.code === 'auth/email-already-in-use' ? 'Cette adresse email est déjà utilisée.' :
                    err.code === 'auth/weak-password' ? 'Le mot de passe doit contenir au moins 6 caractères.' :
                        'Une erreur s\'est produite lors de l\'inscription.';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error('Erreur lors de la connexion:', err);

            const errorMessage =
                err.code === 'auth/user-not-found' ? 'Aucun utilisateur trouvé avec cette adresse email.' :
                    err.code === 'auth/wrong-password' ? 'Mot de passe incorrect.' :
                        err.code === 'auth/too-many-requests' ? 'Trop de tentatives de connexion. Veuillez réessayer plus tard.' :
                            'Une erreur s\'est produite lors de la connexion.';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            setError(null);

            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error('Erreur lors de la connexion avec Google:', err);
            setError('Erreur lors de la connexion avec Google');
        } finally {
            setLoading(false);
        }
    };

    const logOut = async () => {
        try {
            setLoading(true);
            await signOut(auth);
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err);
            setError('Erreur lors de la déconnexion');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            setLoading(true);
            setError(null);
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', err);

            const errorMessage =
                err.code === 'auth/user-not-found' ? 'Aucun utilisateur trouvé avec cette adresse email.' :
                    'Une erreur s\'est produite lors de la réinitialisation du mot de passe.';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (data: Partial<User>) => {
        try {
            setError(null);

            if (!firebaseUser || !user) {
                throw new Error('Utilisateur non connecté');
            }

            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await updateDoc(userDocRef, {
                ...data,
                updatedAt: serverTimestamp()
            });

            // Mettre à jour l'état local
            setUser(prev => prev ? { ...prev, ...data } : null);

            // Mettre à jour le profil Firebase si nécessaire
            if (data.displayName || data.photoURL) {
                await updateProfile(firebaseUser, {
                    displayName: data.displayName || firebaseUser.displayName,
                    photoURL: data.photoURL || firebaseUser.photoURL
                });
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour du profil:', err);
            setError('Erreur lors de la mise à jour du profil');
        }
    };

    const value = {
        user,
        firebaseUser,
        loading,
        signUp,
        signIn,
        logOut,
        signInWithGoogle,
        resetPassword,
        updateUserProfile,
        error
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }

    return context;
};