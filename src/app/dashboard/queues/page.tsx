'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
    ArrowRight
} from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueue } from '@/context/queue-context';
import { useClients } from '@/hooks/use-clients';
import { useSubscription } from '@/hooks/use-subscription';
import LoadingSpinner from '@/components/common/loading-spinner';

export default function QueuesPage() {
    const router = useRouter();
    const { queues, updateQueue, loading } = useQueue();
    const { clients, waitingClients } = useClients();
    const { hasReachedQueueLimit } = useSubscription();
    const [searchQuery, setSearchQuery] = useState('');

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
    const handleToggleQueueActive = async (id: string, isActive: boolean) => {
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
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };

    if (loading) {
        return <LoadingSpinner text="Chargement des files d'attente..." />;
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des files d'attente</h1>
                    <p className="text-muted-foreground">
                        Créez, configurez et gérez vos files d'attente
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une file..."
                            className="pl-9 w-full md:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="gradient"
                        animation="glow"
                        leftIcon={<PlusCircle className="h-4 w-4" />}
                        onClick={() => router.push('/dashboard/queues/create')}
                        disabled={!canCreateQueue}
                    >
                        Nouvelle file
                    </Button>
                </div>
            </div>

            {/* Liste des files d'attente */}
            {queues.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12 bg-accent/5 rounded-lg border border-dashed"
                >
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ListOrdered className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Aucune file d'attente</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
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
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Carte pour créer une nouvelle file */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-dashed border-2 h-full flex flex-col items-center justify-center py-8 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/queues/create')}>
                            <div className="rounded-full bg-primary/10 p-4 mb-4">
                                <PlusCircle className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">Nouvelle file</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                                Créez une nouvelle file d'attente pour organiser vos clients
                            </p>
                            <Button
                                variant="gradient"
                                animation="glow"
                                disabled={!canCreateQueue}
                            >
                                Créer une file
                            </Button>

                            {!canCreateQueue && (
                                <p className="text-xs text-muted-foreground mt-3">
                                    Limite atteinte.
                                    <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/dashboard/subscription')}>
                                        Mettre à niveau
                                    </Button>
                                </p>
                            )}
                        </Card>
                    </motion.div>

                    {/* Files d'attente existantes */}
                    {filteredQueues.map(queue => (
                        <motion.div key={queue.id} variants={itemVariants}>
                            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="line-clamp-2">{queue.name}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleQueueActive(queue.id, queue.isActive);
                                            }}
                                            className={queue.isActive ? 'text-green-600' : 'text-muted-foreground'}
                                        >
                                            {queue.isActive ?
                                                <ToggleRight className="h-6 w-6" /> :
                                                <ToggleLeft className="h-6 w-6" />
                                            }
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {queue.description || 'Aucune description'}
                                    </p>
                                </CardHeader>

                                <CardContent className="flex-grow">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="flex flex-col items-center p-3 bg-accent/5 rounded-lg">
                                            <Users className="h-5 w-5 text-primary mb-1" />
                                            <span className="text-lg font-semibold">{getWaitingClientsCount(queue.id)}</span>
                                            <span className="text-xs text-muted-foreground">En attente</span>
                                        </div>

                                        <div className="flex flex-col items-center p-3 bg-accent/5 rounded-lg">
                                            <Clock className="h-5 w-5 text-yellow-500 mb-1" />
                                            <span className="text-lg font-semibold">{queue.stats?.avgWaitTime || 0}m</span>
                                            <span className="text-xs text-muted-foreground">Temps moyen</span>
                                        </div>
                                    </div>

                                    <div className="text-sm space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Clients quotidiens</span>
                                            <span>{queue.dailyCounter || 0}/{queue.maxClients || 0}</span>
                                        </div>

                                        <div className="w-full bg-muted h-1.5 rounded-full">
                                            <div
                                                className="bg-primary h-1.5 rounded-full"
                                                style={{ width: `${Math.min(100, (queue.dailyCounter / (queue.maxClients || 1)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t pt-4">
                                    <div className="flex w-full justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<QrCode className="h-4 w-4" />}
                                            onClick={() => router.push(`/dashboard/queues/${queue.id}/qrcode`)}
                                        >
                                            QR Code
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<Settings className="h-4 w-4" />}
                                            onClick={() => router.push(`/dashboard/queues/${queue.id}/settings`)}
                                        >
                                            Paramètres
                                        </Button>

                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/queues/${queue.id}`)}
                                            rightIcon={<ArrowRight className="h-4 w-4" />}
                                        >
                                            Ouvrir
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}