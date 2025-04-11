'use client';

import React, { useEffect, Suspense, useState, ComponentType } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { QueueProvider } from '@/context/queue-context';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Définition de l'interface pour les props du Sidebar
interface SidebarProps {
    onClose: () => void;
}

// Import dynamique optimisé des composants avec fallback défini
const Navbar = dynamic(
    () => import('@/components/dashboard/navbar'),
    {
        ssr: false,
        loading: () => <NavbarSkeleton />,
    }
);

const Sidebar = dynamic(() => import('@/components/dashboard/sidebar').then(
    (mod) => mod.default as ComponentType<SidebarProps>
), {
    ssr: false,
    loading: () => <SidebarSkeleton />,
});

// Dynamic import du header avec Next.js
const Header = dynamic(
    () => import('@/components/dashboard/header'),
    {
        ssr: false,
        loading: () => <HeaderSkeleton />,
    }
);

// Composants squelettes pour améliorer l'UX pendant le chargement
const NavbarSkeleton = () => (
    <div className="h-14 border-b border-border/40 bg-background/95 animate-pulse" />
);

const SidebarSkeleton = () => (
    <div className="w-64 bg-card/50 border-r animate-pulse h-screen" />
);

const HeaderSkeleton = () => (
    <div className="h-16 border-b bg-background/95 animate-pulse flex items-center px-6">
        <div className="h-6 w-48 bg-muted/60 rounded-md"></div>
        <div className="ml-auto flex gap-2">
            <div className="h-8 w-8 bg-muted/60 rounded-full"></div>
            <div className="h-8 w-8 bg-muted/60 rounded-full"></div>
        </div>
    </div>
);

// Composant de chargement amélioré pour le Suspense
const LoadingComponent = () => (
    <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
        <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border-2 border-primary opacity-20"></div>
        </div>
        <span className="text-base font-medium">Chargement de votre tableau de bord...</span>
    </div>
);

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fermer le sidebar sur les petits écrans lors d'un changement de route
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Afficher un écran de chargement pendant la vérification de l'authentification
    if (loading) {
        return <LoadingComponent />;
    }

    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!user) {
        redirect('/auth/login');
        return null;
    }

    return (
        <QueueProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Overlay pour fermer le sidebar sur mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar pour les écrans moyens et grands */}
                <div
                    className={`fixed top-0 left-0 z-40 md:relative h-full transition-transform duration-300 ease-in-out transform 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                >
                    <Suspense fallback={<SidebarSkeleton />}>
                        <Sidebar onClose={() => setSidebarOpen(false)} />
                    </Suspense>
                </div>

                {/* Contenu principal */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Navbar mobile (affiché uniquement sur mobile) */}
                    <div className="md:hidden sticky top-0 left-0 right-0 z-30">
                        <Navbar onMenuClick={() => setSidebarOpen(true)} />
                    </div>

                    {/* Header visible uniquement sur écran md et plus */}
                    <div className="hidden md:block sticky top-0 z-20">
                        <Header />
                    </div>

                    {/* Contenu de la page */}
                    <main className="flex-1 overflow-y-auto bg-background/50 pt-1 px-4 md:px-6">
                        {children}
                    </main>
                </div>
            </div>
        </QueueProvider>
    );
}