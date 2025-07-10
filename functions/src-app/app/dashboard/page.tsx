'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusCircle,
    ListOrdered,
    Users,
    Clock,
    Search,
    BarChart2,
    ToggleLeft,
    ToggleRight,
    QrCode,
    Settings,
    ArrowRight,
    ChevronRight,
    AlertCircle,
    X
} from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueue } from '@/context/queue-context';
import { useClients } from '@/hooks/use-clients';
import { useSubscription } from '@/hooks/use-subscription';
import LoadingSpinner from '@/components/common/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function QueuesPage() {
    const router = useRouter();
    const { queues, updateQueue, loading } = useQueue();
    const { clients, waitingClients } = useClients();
    const { hasReachedQueueLimit } = useSubscription();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewportWidth, setViewportWidth] = useState(0);
    const [showSearch, setShowSearch] = useState(false);

    // Détecter la largeur de l'écran pour les adaptations mobiles
    useEffect(() => {
        // Définir la largeur initiale
        setViewportWidth(window.innerWidth);

        // Mettre à jour la largeur lors du redimensionnement
        const handleResize = () => {
            setViewportWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Réinitialiser la recherche lorsqu'on passe en vue mobile
    useEffect(() => {
        if (viewportWidth < 640 && showSearch === false) {
            setSearchQuery('');
        }
    }, [viewportWidth, showSearch]);

    // Calculer le nombre de clients en attente pour chaque file d'attente
    const queueWaitingClientsMap = useMemo(() => {
        const map = new Map<string, number>();

        // Initialiser le compteur à 0 pour toutes les files
        queues.forEach(queue => {
            map.set(queue.id, 0);
        });

        // Compter les clients en attente par file d'attente
        waitingClients.forEach(client => {
            const queueId = client.queueId;
            if (map.has(queueId)) {
                map.set(queueId, (map.get(queueId) || 0) + 1);
            }
        });

        return map;
    }, [queues, waitingClients]);

    // Fonction pour obtenir le nombre de clients en attente pour une file donnée
    const getWaitingClientsCount = (queueId: string): number => {
        return queueWaitingClientsMap.get(queueId) || 0;
    };

    // Filtrer les files d'attente en fonction de la recherche
    const filteredQueues = queues.filter(queue =>
        queue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (queue.description && queue.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Vérifier si l'utilisateur a atteint la limite de files d'attente
    const canCreateQueue = !hasReachedQueueLimit(queues.length);

    // Gérer le changement d'état d'une file d'attente
    const handleToggleQueueActive = async (id: string, isActive: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateQueue(id, { isActive: !isActive });
        } catch (err) {
            console.error('Erreur lors du changement d\'état de la file d\'attente:', err);
        }
    };

    // Animations pour les cartes
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    const searchVariants = {
        hidden: { opacity: 0, width: 0, marginLeft: 0 },
        visible: {
            opacity: 1,
            width: "100%",
            marginLeft: 8,
            transition: { duration: 0.2 }
        },
        exit: {
            opacity: 0,
            width: 0,
            marginLeft: 0,
            transition: { duration: 0.2 }
        }
    };

    if (loading) {
        return <LoadingSpinner text="Chargement des files d'attente..." />;
    }

    return (
        <div className="space-y-4 pb-6 pt-2">
            {/* En-tête adaptative */}
            <div className="flex flex-col gap-4 top-0 bg-background/95 backdrop-blur-sm z-10 pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold sm:text-2xl">Files d'attente</h1>
                        <p className="text-muted-foreground text-sm">
                            Gérez et suivez vos files
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Barre de recherche adaptative */}
                        {viewportWidth >= 640 ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher une file..."
                                    className="pl-9 w-full sm:w-52 md:w-64 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => setShowSearch(!showSearch)}
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                                <AnimatePresence>
                                    {showSearch && (
                                        <motion.div
                                            variants={searchVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className="relative flex-1"
                                        >
                                            <Input
                                                placeholder="Rechercher..."
                                                className="w-full h-9"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}

                        {/* Bouton de création adapté à la taille d'écran */}
                        {(!showSearch || viewportWidth >= 640) && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Button
                                    variant="gradient"
                                    size={viewportWidth < 640 ? "icon" : "default"}
                                    className={viewportWidth < 640 ? "h-9 w-9" : ""}
                                    onClick={() => router.push('/dashboard/queues/create')}
                                    disabled={!canCreateQueue}
                                >
                                    <PlusCircle className={cn(
                                        "h-4 w-4",
                                        viewportWidth >= 640 && "mr-2"
                                    )} />
                                    {viewportWidth >= 640 && "Nouvelle file"}
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Indicateur de recherche sur mobile */}
                {searchQuery && viewportWidth < 640 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center bg-muted/30 rounded-full px-3 py-1 text-xs"
                    >
                        <span className="mr-1">Recherche :</span>
                        <Badge variant="outline" className="font-normal">
                            {searchQuery}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1 p-0"
                            onClick={() => {
                                setSearchQuery('');
                                setShowSearch(false);
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Liste des files d'attente */}
            {queues.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-10 px-4 bg-accent/5 rounded-lg border border-dashed my-8"
                >
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ListOrdered className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Aucune file d'attente</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
                        Vous n'avez pas encore créé de file d'attente. Commencez par créer votre première file pour gérer vos clients.
                    </p>
                    <Button
                        variant="gradient"
                        animation="glow"
                        leftIcon={<PlusCircle className="h-4 w-4" />}
                        onClick={() => router.push('/dashboard/queues/create')}
                        disabled={!canCreateQueue}
                    >
                        Créer ma première file
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {/* Files d'attente existantes */}
                    {filteredQueues.map(queue => (
                        <motion.div
                            key={queue.id}
                            variants={itemVariants}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                            className="transform-gpu will-change-transform"
                            onClick={() => router.push(`/dashboard/queues/${queue.id}`)}
                        >
                            <Card className={cn(
                                "h-full flex flex-col border-muted hover:border-primary/30 transition-colors cursor-pointer overflow-hidden",
                                !queue.isActive && "bg-gray-50 dark:bg-gray-900/50 opacity-90"
                            )}>
                                {!queue.isActive && (
                                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg px-4 py-2 flex items-center shadow-sm">
                                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                                            <span className="text-xs font-medium text-red-700 dark:text-red-400">File désactivée</span>
                                        </div>
                                    </div>
                                )}
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <div className="flex justify-between items-start gap-1">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <CardTitle className="line-clamp-1 text-base">{queue.name}</CardTitle>
                                                <Badge
                                                    variant={queue.isActive ? "gradient" : "outline"}
                                                    className={cn(
                                                        "ml-2 h-5 text-[10px]",
                                                        !queue.isActive && "text-muted-foreground border-muted-foreground/40"
                                                    )}
                                                >
                                                    {queue.isActive ? "Actif" : "Inactif"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {queue.description || 'Aucune description'}
                                            </p>
                                        </div>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();  // Empêche la navigation vers la file
                                                handleToggleQueueActive(queue.id, queue.isActive || false, e);
                                            }}
                                            className={cn(
                                                "relative flex h-7 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out z-20",
                                                queue.isActive
                                                    ? "border-green-600 bg-green-600"
                                                    : "border-muted-foreground/30 bg-muted"
                                            )}
                                        >
                                            <span className="sr-only">{queue.isActive ? 'Désactiver' : 'Activer'} la file</span>
                                            <motion.div
                                                className="pointer-events-none h-6 w-6 rounded-full bg-white shadow-md"
                                                animate={{
                                                    x: queue.isActive ? 16 : 0,
                                                }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                            {/* Icône pour l'état */}
                                            <motion.div
                                                className={cn(
                                                    "absolute inset-0 flex items-center justify-center text-[10px] font-medium",
                                                    queue.isActive ? "text-white" : "text-muted-foreground"
                                                )}
                                                initial={false}
                                                animate={{ opacity: 1 }}
                                            >
                                                {queue.isActive ? (
                                                    <motion.span
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="pl-3"
                                                    >
                                                        ON
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="pr-3 ml-auto"
                                                    >
                                                        OFF
                                                    </motion.span>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className={cn(
                                    "flex-grow px-4 py-3",
                                    !queue.isActive && "opacity-75"
                                )}>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="flex flex-col items-center p-2 bg-accent/5 rounded-lg">
                                            <Users className="h-4 w-4 text-primary mb-1" />
                                            <span className="text-lg font-medium leading-none">{getWaitingClientsCount(queue.id)}</span>
                                            <span className="text-xs text-muted-foreground mt-1">En attente</span>
                                        </div>

                                        <div className="flex flex-col items-center p-2 bg-accent/5 rounded-lg">
                                            <Clock className="h-4 w-4 text-amber-500 mb-1" />
                                            <span className="text-lg font-medium leading-none">{queue.stats?.avgWaitTime || 0}m</span>
                                            <span className="text-xs text-muted-foreground mt-1">Tps. moyen</span>
                                        </div>
                                    </div>

                                    <div className="text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Clients aujourd'hui</span>
                                            <span className="font-medium">{queue.dailyCounter || 0}/{queue.maxClients || 0}</span>
                                        </div>

                                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all",
                                                    (queue.dailyCounter || 0) / (queue.maxClients || 1) > 0.8
                                                        ? "bg-amber-500"
                                                        : "bg-primary"
                                                )}
                                                style={{ width: `${Math.min(100, ((queue.dailyCounter || 0) / (queue.maxClients || 1)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t pt-3 pb-3 px-4 flex justify-between items-center">
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/queues/${queue.id}/qrcode`);
                                            }}
                                        >
                                            <QrCode className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/queues/${queue.id}/settings`);
                                            }}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center text-xs text-primary font-medium">
                                        <span>Gérer la file</span>
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Carte pour créer une nouvelle file */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={canCreateQueue ? { y: -3, transition: { duration: 0.2 } } : {}}
                        className={cn(
                            "transform-gpu will-change-transform",
                            !canCreateQueue && "opacity-70"
                        )}
                    >
                        <Card
                            className={cn(
                                "border-dashed border-2 h-full flex flex-col items-center justify-center py-6 px-4 transition-colors",
                                canCreateQueue
                                    ? "hover:border-primary/50 cursor-pointer"
                                    : "border-muted cursor-not-allowed"
                            )}
                            onClick={() => canCreateQueue && router.push('/dashboard/queues/create')}
                        >
                            <div className={cn(
                                "rounded-full p-3 mb-3",
                                canCreateQueue ? "bg-primary/10" : "bg-muted"
                            )}>
                                <PlusCircle className={cn(
                                    "h-6 w-6",
                                    canCreateQueue ? "text-primary" : "text-muted-foreground/50"
                                )} />
                            </div>
                            <h3 className="text-lg font-medium mb-1">Nouvelle file</h3>
                            <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
                                {canCreateQueue
                                    ? "Créez une nouvelle file d'attente pour organiser vos clients"
                                    : "Votre abonnement actuel ne permet pas de créer plus de files"
                                }
                            </p>
                            <Button
                                variant={canCreateQueue ? "gradient" : "outline"}
                                size="sm"
                                disabled={!canCreateQueue}
                            >
                                {canCreateQueue ? "Créer une file" : "Limite atteinte"}
                            </Button>

                            {!canCreateQueue && (
                                <div className="flex items-center mt-3 gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Limite atteinte.
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-xs ml-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push('/dashboard/subscription');
                                            }}
                                        >
                                            Mettre à niveau
                                        </Button>
                                    </p>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}