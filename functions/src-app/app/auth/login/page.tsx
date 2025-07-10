'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { useAuth } from '@/context/auth-context';
import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/common/logo';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Rediriger vers le tableau de bord si l'utilisateur est déjà connecté
    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Afficher un indicateur de chargement pendant la vérification de l'authentification
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="nofile-spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="py-4 px-6 bg-background/80 backdrop-blur-sm">
                <Logo animated href="/" />
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <LoginForm />
                </div>
            </main>

            <footer className="py-4 px-6 text-center text-sm text-muted-foreground">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    NoFile v3 &copy; {new Date().getFullYear()} - Tous droits réservés
                </motion.p>
            </footer>
        </div>
    );
}