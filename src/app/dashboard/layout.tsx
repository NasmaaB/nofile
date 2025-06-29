'use client';

import React, { useEffect, Suspense, useState, ComponentType, useCallback } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { QueueProvider } from '@/context/queue-context';
import dynamic from 'next/dynamic';
import { Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="h-14 border-b border-border/40 bg-background/95 backdrop-blur-sm animate-pulse" />
);

const SidebarSkeleton = () => (
    <div className="w-64 bg-card/50 border-r animate-pulse h-screen" />
);

const HeaderSkeleton = () => (
    <div className="h-14 sm:h-16 border-b bg-background/95 animate-pulse flex items-center px-4 sm:px-6">
        <div className="h-5 w-36 sm:w-48 bg-muted/60 rounded-md"></div>
        <div className="ml-auto flex gap-2">
            <div className="h-8 w-8 bg-muted/60 rounded-full"></div>
            <div className="h-8 w-8 bg-muted/60 rounded-full"></div>
        </div>
    </div>
);

// Composant de chargement amélioré pour le Suspense
const LoadingComponent = () => (
    <div className="fixed inset-0 bg-background flex items-center justify-center flex-col gap-4 z-50">
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
    const [isMobileView, setIsMobileView] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    // Détecter si on est sur mobile
    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        // Vérifier immédiatement
        checkMobileView();

        // Puis lors des redimensionnements
        window.addEventListener('resize', checkMobileView);

        // Marquer le layout comme prêt après montage
        const timer = setTimeout(() => setIsLayoutReady(true), 200);

        return () => {
            window.removeEventListener('resize', checkMobileView);
            clearTimeout(timer);
        };
    }, []);

    // Fermer le sidebar sur les petits écrans lors d'un changement de route
    const closeSidebar = useCallback(() => {
        if (isMobileView) {
            setSidebarOpen(false);
        }
    }, [isMobileView]);

    // Effet pour détecter les clics à l'extérieur du sidebar
    useEffect(() => {
        const handleRouteChange = () => {
            closeSidebar();
        };

        // Ajouter un listener pour les événements de navigation Next.js
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [closeSidebar]);

    // Désactiver le scroll du body quand le sidebar est ouvert sur mobile
    useEffect(() => {
        if (isMobileView && sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen, isMobileView]);

    // Afficher un écran de chargement pendant la vérification de l'authentification
    if (loading) {
        return <LoadingComponent />;
    }

    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!user) {
        redirect('/auth/login');
        return null;
    }

    // Variants pour les animations
    const sidebarVariants = {
        hidden: { x: '-100%', opacity: 0.5 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 350, damping: 30 }
        },
        exit: {
            x: '-100%',
            opacity: 0,
            transition: { duration: 0.2, ease: 'easeInOut' }
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const mainContentVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3, delay: 0.1 }
        }
    };

    return (
        <QueueProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Sidebar mobile avec animation */}
                <AnimatePresence>
                    {(sidebarOpen || !isMobileView) && (
                        <>
                            {/* Overlay pour fermer le sidebar sur mobile */}
                            {isMobileView && (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={overlayVariants}
                                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                                    onClick={closeSidebar}
                                />
                            )}

                            {/* Sidebar avec animation */}
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={sidebarVariants}
                                className={`fixed md:sticky top-0 left-0 z-50 h-full md:h-screen flex-shrink-0 
                                    ${!isMobileView ? 'w-64 md:w-[240px]' : 'w-[240px]'}`}
                            >
                                <Suspense fallback={<SidebarSkeleton />}>
                                    <Sidebar onClose={closeSidebar} />
                                </Suspense>

                                {/* Bouton de fermeture sur mobile */}
                                {isMobileView && (
                                    <button
                                        className="absolute top-4 right-4 md:hidden z-50 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={closeSidebar}
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </button>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Contenu principal */}
                <motion.div
                    className="flex-1 flex flex-col overflow-hidden relative"
                    initial="hidden"
                    animate={isLayoutReady ? "visible" : "hidden"}
                    variants={mainContentVariants}
                >
                    {/* Navbar mobile */}
                    <div className="md:hidden sticky top-0 z-30">
                        <Navbar onMenuClick={() => setSidebarOpen(true)} />
                    </div>

                    {/* Header visible uniquement sur écran md et plus */}
                    <div className="hidden md:block sticky top-0 z-20">
                        <Suspense fallback={<HeaderSkeleton />}>
                            <Header />
                        </Suspense>
                    </div>

                    {/* Contenu de la page avec support pour le safe area en bas sur les mobiles */}
                    <main className="flex-1 overflow-y-auto bg-background/50 pt-1 px-3 pb-safe sm:px-4 md:px-6">
                        {children}
                    </main>
                </motion.div>
            </div>
        </QueueProvider>
    );
}