import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useAuth } from './auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('system');

    // Utilisation sécurisée de useAuth
    let user = null;
    let authAvailable = false;

    try {
        const auth = useAuth();
        user = auth.user;
        authAvailable = true;
    } catch (error) {
        // AuthProvider n'est pas disponible, on continue sans synchronisation utilisateur
        console.log('AuthProvider non disponible, fonctionnement en mode local uniquement');
    }

    // Effet pour initialiser le thème
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Récupérer le thème depuis localStorage
        const storedTheme = localStorage.getItem('theme') as Theme | null;

        if (storedTheme) {
            // Utiliser le thème stocké localement
            setThemeState(storedTheme);
        } else if (authAvailable && user?.settings?.theme) {
            // Récupérer le thème depuis les préférences utilisateur si disponible
            setThemeState(user.settings.theme);
        } else {
            // Sinon, utiliser les préférences du système
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
        }
    }, [user, authAvailable]);

    // Effet pour appliquer le thème au DOM
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Stocker le thème dans localStorage
        localStorage.setItem('theme', theme);

        // Appliquer le thème au document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);

        // Sauvegarder la préférence dans Firestore si l'utilisateur est connecté
        if (authAvailable && user) {
            try {
                const userRef = doc(db, 'users', user.id);
                await updateDoc(userRef, {
                    'settings.theme': newTheme
                });
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du thème:', error);
            }
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const value = {
        theme,
        setTheme,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            <NextThemesProvider attribute="class" defaultTheme={theme} enableSystem>
                {children}
            </NextThemesProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
    }

    return context;
};