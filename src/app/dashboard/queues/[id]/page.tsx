'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    Users,
    Clock,
    Bell,
    QrCode,
    Settings,
    Plus,
    Copy,
    Share2,
    ToggleLeft,
    ToggleRight,
    Edit,
    Trash2,
    ChevronRight,
    ArrowRight,
    Check,
    BarChart2
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQueue } from '@/context/queue-context';
import { useClients } from '@/hooks/use-clients';
import { Queue, QueueSettings } from '@/types';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function QueueDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { queues, currentQueue, setCurrentQueue, updateQueue, deleteQueue } = useQueue();
    const { waitingClients, servedClientsToday } = useClients();
    const [queue, setQueue] = useState<Queue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [copied, setCopied] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Récupérer l'ID de la file d'attente depuis l'URL
    const queueId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

    // Charger la file d'attente
    useEffect(() => {
        if (!queueId) {
            setError('Identifiant de file d\'attente invalide');
            setLoading(false);
            return;
        }

        const selectedQueue = queues.find(q => q.id === queueId);

        if (selectedQueue) {
            setQueue(selectedQueue);
            setCurrentQueue(selectedQueue);
            setIsActive(selectedQueue.isActive);
            setLoading(false);
        } else {
            setError('File d\'attente introuvable');
            setLoading(false);
        }
    }, [queueId, queues, setCurrentQueue]);

    // Gérer le changement d'état actif/inactif
    const handleToggleActive = async () => {
        if (!queue) return;

        try {
            await updateQueue(queue.id, { isActive: !isActive });
            setIsActive(!isActive);
        } catch (err) {
            console.error('Erreur lors du changement d\'état de la file d\'attente:', err);
        }
    };

    // Copier le lien public
    const handleCopyLink = () => {
        if (!queue) return;

        navigator.clipboard.writeText(queue.publicUrl);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    // Supprimer la file d'attente
    const handleDeleteQueue = async () => {
        if (!queue) return;

        try {
            await deleteQueue(queue.id);
            router.push('/dashboard/queues');
        } catch (err) {
            console.error('Erreur lors de la suppression de la file d\'attente:', err);
        }
    };

    // Fonction utilitaire pour mettre à jour les paramètres en garantissant que tous les champs requis sont présents
    const updateQueueSettings = (partialSettings: Partial<QueueSettings>) => {
        if (!queue || !queue.settings) return;

        const newSettings: QueueSettings = {
            allowSelfRegistration: queue.settings.allowSelfRegistration,
            requireClientPhone: queue.settings.requireClientPhone,
            requireClientEmail: queue.settings.requireClientEmail,
            notifyNextClientInAdvance: queue.settings.notifyNextClientInAdvance,
            notifyAdvanceCount: queue.settings.notifyAdvanceCount,
            notificationType: queue.settings.notificationType,
            autoIncrementToken: queue.settings.autoIncrementToken,
            displayEstimatedWaitTime: queue.settings.displayEstimatedWaitTime,
            ...partialSettings
        };

        updateQueue(queue.id, { settings: newSettings });
    };

    // Afficher un écran de chargement
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="nofile-spinner"></div>
            </div>
        );
    }

    // Afficher un message d'erreur
    if (error || !queue) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive">Erreur</h2>
                <p className="text-muted-foreground">{error || 'Une erreur s\'est produite'}</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/queues')}
                >
                    Retour aux files d'attente
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête de la file d'attente */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card rounded-lg shadow-sm p-6 border">
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold">{queue.name}</h1>
                            <div className={`ml-3 px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-1">{queue.description || 'Aucune description'}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Créée le {formatDate(queue.createdAt, 'd MMMM yyyy')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            leftIcon={isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            onClick={handleToggleActive}
                            className={isActive ? 'text-green-600' : 'text-muted-foreground'}
                        >
                            {isActive ? 'Désactiver' : 'Activer'}
                        </Button>

                        <Button
                            variant="outline"
                            leftIcon={<Edit className="h-4 w-4" />}
                            onClick={() => router.push(`/dashboard/queues/${queue.id}/edit`)}
                        >
                            Modifier
                        </Button>

                        <Button
                            variant={deleteConfirm ? 'destructive' : 'outline'}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            onClick={() => {
                                if (deleteConfirm) {
                                    handleDeleteQueue();
                                } else {
                                    setDeleteConfirm(true);
                                    setTimeout(() => setDeleteConfirm(false), 3000);
                                }
                            }}
                        >
                            {deleteConfirm ? 'Confirmer' : 'Supprimer'}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Cartes de statistiques */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid gap-4 md:grid-cols-4"
            >
                {/* Clients en attente */}
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Users className="h-4 w-4 mr-2 text-primary" />
                            Clients en attente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{waitingClients?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {waitingClients?.length && waitingClients.length > 0
                                ? `Prochain: ${waitingClients[0].name}`
                                : 'Aucun client en attente'}
                        </p>
                    </CardContent>
                </Card>

                {/* Temps d'attente moyen */}
                <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                            Temps d'attente moyen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{queue.stats?.avgWaitTime || 0} min</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Max: {queue.stats?.maxWaitTime || 0} min
                        </p>
                    </CardContent>
                </Card>

                {/* Clients servis */}
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Clients servis aujourd'hui
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{servedClientsToday?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total: {queue.stats?.totalServed || 0} clients
                        </p>
                    </CardContent>
                </Card>

                {/* Utilisation quotidienne */}
                <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2 text-accent" />
                            Utilisation quotidienne
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {queue.dailyCounter || 0}/{queue.maxClients || 0}
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full mt-2">
                            <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${Math.min(100, (queue.dailyCounter / (queue.maxClients || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* QR Code et lien public */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid md:grid-cols-2 gap-6"
            >
                {/* QR Code */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <QrCode className="h-5 w-5 mr-2 text-primary" />
                            QR Code d'inscription
                        </CardTitle>
                        <CardDescription>
                            Les clients peuvent scanner ce code pour rejoindre la file d'attente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="border p-4 rounded-lg bg-white mb-4">
                            <QRCodeSVG
                                value={queue.publicUrl}
                                size={200}
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                level="L"
                                includeMargin={false}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full">
                            <Input
                                value={queue.publicUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyLink}
                                className={copied ? 'text-green-500' : ''}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            leftIcon={<Share2 className="h-4 w-4" />}
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: `File d'attente: ${queue.name}`,
                                        text: `Rejoignez la file d'attente en scannant le QR code ou en cliquant sur le lien`,
                                        url: queue.publicUrl
                                    });
                                } else {
                                    handleCopyLink();
                                }
                            }}
                        >
                            Partager
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/queues/${queue.id}/qrcode`)}
                            rightIcon={<ChevronRight className="h-4 w-4" />}
                        >
                            Personnaliser
                        </Button>
                    </CardFooter>
                </Card>

                {/* Paramètres et actions rapides */}
                <div className="md:col-span-1 space-y-6">
                    {/* Paramètres rapides */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Settings className="h-5 w-5 mr-2 text-primary" />
                                Paramètres rapides
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Notifications SMS</p>
                                        <p className="text-xs text-muted-foreground">Alerter les clients par SMS</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (!queue.settings) return;

                                        const includesSMS = queue.settings.notificationType.includes('sms');
                                        const notificationType = includesSMS
                                            ? queue.settings.notificationType.filter(t => t !== 'sms')
                                            : [...queue.settings.notificationType, 'sms'] as ("email" | "sms")[];

                                        updateQueueSettings({ notificationType });
                                    }}
                                >
                                    {queue.settings?.notificationType?.includes('sms')
                                        ? <ToggleRight className="h-6 w-6 text-primary" />
                                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <QrCode className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Auto-inscription</p>
                                        <p className="text-xs text-muted-foreground">Permettre aux clients de s'inscrire</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (!queue.settings) return;

                                        updateQueueSettings({
                                            allowSelfRegistration: !queue.settings.allowSelfRegistration
                                        });
                                    }}
                                >
                                    {queue.settings?.allowSelfRegistration
                                        ? <ToggleRight className="h-6 w-6 text-primary" />
                                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Temps d'attente estimé</p>
                                        <p className="text-xs text-muted-foreground">Afficher aux clients</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (!queue.settings) return;

                                        updateQueueSettings({
                                            displayEstimatedWaitTime: !queue.settings.displayEstimatedWaitTime
                                        });
                                    }}
                                >
                                    {queue.settings?.displayEstimatedWaitTime
                                        ? <ToggleRight className="h-6 w-6 text-primary" />
                                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full"
                                rightIcon={<ChevronRight className="h-4 w-4" />}
                                onClick={() => router.push(`/dashboard/queues/${queue.id}/settings`)}
                            >
                                Tous les paramètres
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Actions rapides */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <ArrowRight className="h-5 w-5 mr-2 text-primary" />
                                Actions rapides
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                leftIcon={<Plus className="h-4 w-4" />}
                                onClick={() => router.push(`/dashboard/clients/add?queueId=${queue.id}`)}
                            >
                                Ajouter un client
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                leftIcon={<Bell className="h-4 w-4" />}
                                onClick={() => router.push(`/dashboard/queues/${queue.id}/notifications`)}
                            >
                                Envoyer une notification
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                leftIcon={<BarChart2 className="h-4 w-4" />}
                                onClick={() => router.push(`/dashboard/statistics?queueId=${queue.id}`)}
                            >
                                Voir les statistiques
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Liste des clients en attente */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center">
                                <Users className="h-5 w-5 mr-2 text-primary" />
                                Clients en attente
                            </CardTitle>
                            <CardDescription>
                                {waitingClients?.length
                                    ? `${waitingClients.length} client${waitingClients.length > 1 ? 's' : ''} dans la file`
                                    : 'Aucun client en attente'}
                            </CardDescription>
                        </div>

                        <Button
                            variant="gradient"
                            animation="glow"
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={() => router.push(`/dashboard/clients/add?queueId=${queue.id}`)}
                        >
                            Ajouter un client
                        </Button>
                    </CardHeader>

                    <CardContent>
                        {!waitingClients?.length ? (
                            <div className="text-center py-8">
                                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">Aucun client en attente</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Ajoutez des clients à la file d'attente ou activez l'auto-inscription
                                </p>
                                <Button
                                    variant="gradient"
                                    leftIcon={<Plus className="h-4 w-4" />}
                                    onClick={() => router.push(`/dashboard/clients/add?queueId=${queue.id}`)}
                                >
                                    Ajouter un client
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {waitingClients.slice(0, 5).map((client, index) => (
                                    <div key={client.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="bg-primary/20 text-primary rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{client.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Token: {client.token} | Attente: ~{client.estimatedWaitTime} min
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                leftIcon={<Bell className="h-4 w-4" />}
                                                onClick={() => router.push(`/dashboard/clients/${client.id}/notify`)}
                                            >
                                                Notifier
                                            </Button>

                                            <Button
                                                variant="gradient"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                            >
                                                Servir
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {waitingClients.length > 5 && (
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        onClick={() => router.push('/dashboard/clients')}
                                    >
                                        Voir tous les clients ({waitingClients.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}