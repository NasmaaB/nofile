'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Phone,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    Bell,
    ArrowLeft,
    Edit,
    Trash2,
    MessageSquare,
    FileClock,
    CalendarClock,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useQueue } from '@/context/queue-context';
import { Client } from '@/types';
import { formatDate, formatPhoneNumber, timeAgo, cn } from '@/lib/utils';

interface TimelineEvent {
    date: Date | Timestamp;
    type: string;
    icon: React.ReactNode;
    title: string;
    color: string;
    current?: boolean;
}

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { getClient, updateClient, cancelClient, serveClient } = useQueue();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Récupérer l'ID du client depuis l'URL
    const clientId =
        typeof params.id === 'string'
            ? params.id
            : Array.isArray(params.id)
                ? params.id[0]
                : '';

    // Charger les détails du client
    useEffect(() => {
        const loadClient = async () => {
            if (!clientId) {
                setError('Identifiant client invalide');
                setLoading(false);
                return;
            }

            try {
                const clientData = await getClient(clientId);

                if (clientData) {
                    setClient(clientData);
                } else {
                    setError('Client introuvable');
                }
            } catch (err) {
                console.error('Erreur lors du chargement du client:', err);
                setError('Erreur lors du chargement des détails du client');
            } finally {
                setLoading(false);
            }
        };

        loadClient();
    }, [clientId, getClient]);

    // Servir le client
    const handleServeClient = async () => {
        if (!client) return;

        setActionLoading(true);

        try {
            await serveClient(client.id);
            setClient(prev => (prev ? { ...prev, status: 'served', servedAt: new Date() } : null));
            toast({
                title: "Client servi avec succès",
                description: `${client.name} a été marqué comme servi.`,
                variant: "success"
            });
        } catch (err) {
            console.error('Erreur lors du service du client:', err);
            toast({
                title: "Erreur",
                description: "Impossible de servir le client. Veuillez réessayer.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Annuler le client
    const handleCancelClient = async () => {
        if (!client) return;

        setActionLoading(true);

        try {
            await cancelClient(client.id);
            setClient(prev => (prev ? { ...prev, status: 'canceled' } : null));
            toast({
                title: "Client annulé",
                description: `${client.name} a été retiré de la file d'attente.`,
                variant: "default"
            });
        } catch (err) {
            console.error("Erreur lors de l'annulation du client:", err);
            toast({
                title: "Erreur",
                description: "Impossible d'annuler le client. Veuillez réessayer.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
            setDeleteConfirm(false);
        }
    };

    // Écran de chargement
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                <p>Chargement des informations client...</p>
            </div>
        );
    }

    // Message d'erreur
    if (error || !client) {
        return (
            <div className="max-w-md mx-auto my-8">
                <Card className="border-destructive/30">
                    <CardHeader className="bg-destructive/5 border-b border-destructive/30">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <CardTitle className="text-destructive">Erreur</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground mb-6">{error || "Une erreur s'est produite"}</p>
                        <Button
                            variant="default"
                            className="w-full"
                            onClick={() => router.push('/dashboard/clients')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour à la liste des clients
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Configuration de l'affichage du statut
    const statusConfig = {
        waiting: {
            color: 'bg-primary/10 text-primary border-primary/20',
            icon: <Clock className="h-5 w-5" />,
            label: 'En attente',
            description: 'Client en attente de service'
        },
        serving: {
            color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            icon: <FileClock className="h-5 w-5" />,
            label: 'En cours',
            description: 'Client en cours de service'
        },
        served: {
            color: 'bg-green-500/10 text-green-500 border-green-500/20',
            icon: <CheckCircle className="h-5 w-5" />,
            label: 'Servi',
            description: 'Client servi avec succès'
        },
        canceled: {
            color: 'bg-red-500/10 text-red-500 border-red-500/20',
            icon: <XCircle className="h-5 w-5" />,
            label: 'Annulé',
            description: 'Client annulé'
        },
        'no-show': {
            color: 'bg-red-500/10 text-red-500 border-red-500/20',
            icon: <XCircle className="h-5 w-5" />,
            label: 'Non-venu',
            description: 'Client non présenté'
        }
    };

    const status = statusConfig[client.status] || statusConfig.waiting;

    // Récupérer les événements chronologiques triés par date
    const timelineEvents: TimelineEvent[] = [
        {
            date: client.createdAt,
            type: 'created',
            icon: <User className="h-4 w-4 text-primary" />,
            title: 'Client ajouté',
            color: 'bg-primary/10'
        },
        ...(client.notifiedAt ? [{
            date: client.notifiedAt,
            type: 'notified',
            icon: <Bell className="h-4 w-4 text-amber-500" />,
            title: 'Notification envoyée',
            color: 'bg-amber-500/10'
        }] : []),
        ...(client.calledAt ? [{
            date: client.calledAt,
            type: 'called',
            icon: <FileClock className="h-4 w-4 text-yellow-500" />,
            title: 'Client appelé',
            color: 'bg-yellow-500/10'
        }] : []),
        ...(client.servedAt ? [{
            date: client.servedAt,
            type: 'served',
            icon: <CheckCircle className="h-4 w-4 text-green-500" />,
            title: 'Client servi',
            color: 'bg-green-500/10'
        }] : []),
        ...(client.status === 'canceled' ? [{
            date: client.updatedAt || new Date(),
            type: 'canceled',
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            title: 'Client annulé',
            color: 'bg-red-500/10'
        }] : []),
        ...(client.status === 'no-show' ? [{
            date: client.updatedAt || new Date(),
            type: 'no-show',
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            title: 'Client non-venu',
            color: 'bg-red-500/10'
        }] : []),
        ...(client.status === 'waiting' ? [{
            date: new Date(),
            type: 'waiting',
            icon: <Clock className="h-4 w-4 text-primary" />,
            title: 'En attente',
            color: 'bg-primary/10',
            current: true
        }] : [])
    ].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateA.getTime() - dateB.getTime();
    });

    return (
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
            {/* Bouton retour + titre */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-1 text-muted-foreground hover:text-foreground mb-4 sm:mb-0 -ml-2"
                    onClick={() => router.push('/dashboard/clients')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour à la liste</span>
                </Button>

                <Badge
                    variant="outline"
                    className={cn("px-3 py-1.5 text-sm font-medium flex items-center gap-1.5", status.color)}
                >
                    {status.icon}
                    {status.label}
                </Badge>
            </div>

            {/* En-tête du client */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="overflow-hidden border-t-4" style={{ borderTopColor: status.color.split(' ')[1].replace('text-', '') }}>
                    <CardHeader className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-2xl font-bold">{client.name}</CardTitle>
                                </div>
                                <CardDescription className="text-base max-w-md">
                                    {status.description}
                                    {client.status === 'waiting' && client.position > 0 ? ` • Position ${client.position}` : ''}
                                </CardDescription>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 md:mt-0">
                                <div className="flex flex-col items-center justify-center bg-muted/40 rounded-lg px-5 py-2 border">
                                    <span className="text-sm text-muted-foreground">Numéro</span>
                                    <span className="text-2xl font-bold text-primary">{client.token}</span>
                                </div>

                                {client.status === 'waiting' && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex flex-col items-center justify-center bg-primary/5 rounded-lg px-5 py-2 border border-primary/10">
                                                    <span className="text-sm text-muted-foreground">Attente</span>
                                                    <span className="text-2xl font-bold text-primary">{client.estimatedWaitTime || 0}<span className="text-sm font-normal"> min</span></span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Temps d'attente estimé</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="bg-muted/30 px-6 py-4 flex flex-wrap gap-y-3 gap-x-6 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>Ajouté {timeAgo(client.createdAt)}</span>
                            </div>
                            {client.phone && (
                                <div className="flex items-center text-muted-foreground">
                                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{formatPhoneNumber(client.phone)}</span>
                                </div>
                            )}
                            {client.email && (
                                <div className="flex items-center text-muted-foreground">
                                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]" title={client.email}>{client.email}</span>
                                </div>
                            )}
                            <div className="flex items-center text-muted-foreground">
                                <CalendarClock className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>File {client.queueId}</span>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {client.notifiedAt && (
                                    <div className="space-y-1.5">
                                        <div className="text-sm font-medium text-muted-foreground">Dernière notification</div>
                                        <div className="font-medium">
                                            {formatDate(client.notifiedAt, 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </div>
                                )}

                                {client.calledAt && (
                                    <div className="space-y-1.5">
                                        <div className="text-sm font-medium text-muted-foreground">Appelé à</div>
                                        <div className="font-medium">
                                            {formatDate(client.calledAt, 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </div>
                                )}

                                {client.servedAt && (
                                    <div className="space-y-1.5">
                                        <div className="text-sm font-medium text-muted-foreground">Servi à</div>
                                        <div className="font-medium">
                                            {formatDate(client.servedAt, 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {client.notes && (
                                <div className="mt-6 pt-6 border-t">
                                    <div className="text-sm font-medium text-muted-foreground mb-2">Notes</div>
                                    <div className="p-3 bg-muted/30 rounded-md">{client.notes}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-6 pt-0">
                        <AnimatePresence>
                            {/* Actions basées sur le statut */}
                            {client.status === 'waiting' && (
                                <motion.div
                                    className="flex flex-wrap gap-3 w-full"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                >
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 min-w-[120px]"
                                        onClick={() => router.push(`/dashboard/clients/${client.id}/notify`)}
                                    >
                                        <Bell className="h-4 w-4 mr-2" />
                                        Notifier
                                    </Button>
                                    <Button
                                        variant={deleteConfirm ? "destructive" : "outline"}
                                        size="lg"
                                        className="flex-1 min-w-[120px]"
                                        onClick={() => {
                                            if (deleteConfirm) {
                                                handleCancelClient();
                                            } else {
                                                setDeleteConfirm(true);
                                                setTimeout(() => setDeleteConfirm(false), 3000);
                                            }
                                        }}
                                        disabled={actionLoading && !deleteConfirm}
                                    >
                                        {deleteConfirm ? (
                                            <>
                                                <AlertCircle className="h-4 w-4 mr-2" />
                                                Confirmer
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Annuler
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="lg"
                                        className="flex-[2] min-w-[160px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground"
                                        onClick={handleServeClient}
                                        disabled={actionLoading && !deleteConfirm}
                                    >
                                        {actionLoading && !deleteConfirm ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Servir le client
                                    </Button>
                                </motion.div>
                            )}

                            {client.status === 'serving' && (
                                <motion.div
                                    className="flex flex-wrap gap-3 w-full"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                >
                                    <Button
                                        variant={deleteConfirm ? "destructive" : "outline"}
                                        size="lg"
                                        className="flex-1"
                                        onClick={() => {
                                            if (deleteConfirm) {
                                                handleCancelClient();
                                            } else {
                                                setDeleteConfirm(true);
                                                setTimeout(() => setDeleteConfirm(false), 3000);
                                            }
                                        }}
                                        disabled={actionLoading && !deleteConfirm}
                                    >
                                        {deleteConfirm ? (
                                            <>
                                                <AlertCircle className="h-4 w-4 mr-2" />
                                                Confirmer
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Non-venu
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="lg"
                                        className="flex-[2] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                        onClick={handleServeClient}
                                        disabled={actionLoading && !deleteConfirm}
                                    >
                                        {actionLoading && !deleteConfirm ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Terminer le service
                                    </Button>
                                </motion.div>
                            )}

                            {(client.status === 'served' ||
                                client.status === 'canceled' ||
                                client.status === 'no-show') && (
                                    <motion.div
                                        className="w-full"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                            onClick={() => router.push(`/dashboard/clients/${client.id}/feedback`)}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Ajouter un feedback
                                        </Button>
                                    </motion.div>
                                )}
                        </AnimatePresence>
                    </CardFooter>
                </Card>
            </motion.div>

            {/* Chronologie du client */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card>
                    <CardHeader className="p-6">
                        <CardTitle className="text-xl">Chronologie</CardTitle>
                        <CardDescription>
                            Historique des interactions avec {client.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="relative space-y-0">
                            {timelineEvents.map((event, index) => (
                                <div key={event.type} className="flex gap-3 pb-8 relative">
                                    {/* Ligne verticale entre les événements */}
                                    {index < timelineEvents.length - 1 && (
                                        <div
                                            className={cn(
                                                "absolute top-7 left-3.5 w-0.5 -ml-px h-full bg-muted",
                                                event.current ? "bg-gradient-to-b from-muted to-transparent" : ""
                                            )}
                                        />
                                    )}

                                    {/* Icône d'événement */}
                                    <div className={cn(
                                        "h-7 w-7 rounded-full flex items-center justify-center z-10",
                                        event.color,
                                        event.current ? "ring-2 ring-primary ring-offset-2" : ""
                                    )}>
                                        {event.icon}
                                    </div>

                                    {/* Contenu de l'événement */}
                                    <div className="flex-1 pt-0.5">
                                        <div className="flex flex-col xs:flex-row xs:items-center gap-x-2 mb-1">
                                            <h4 className="font-medium">{event.title}</h4>
                                            <span
                                                className={cn(
                                                    "text-sm text-muted-foreground",
                                                    event.current ? "text-primary font-medium" : ""
                                                )}
                                            >
                                                {formatDate(event.date, 'dd MMMM yyyy à HH:mm')}
                                            </span>
                                        </div>

                                        {event.type === 'waiting' && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Position actuelle: <span className="font-medium">{client.position}</span> •
                                                Temps d'attente estimé: <span className="font-medium">{client.estimatedWaitTime} min</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}