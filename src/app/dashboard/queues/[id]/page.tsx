'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    BarChart2,
    AlertTriangle,
    ChevronLeft,
    Eye,
    Link as LinkIcon,
    Loader2,
    X,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useQueue } from '@/context/queue-context';
import { useClients } from '@/hooks/use-clients';
import { Queue, QueueSettings } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function QueueDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const { queues, setCurrentQueue, updateQueue, deleteQueue } = useQueue();
    const { waitingClients, servedClientsToday } = useClients();

    const [queue, setQueue] = useState<Queue | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingActive, setUpdatingActive] = useState(false);
    const [updatingSettings, setUpdatingSettings] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isNotification, setIsNotification] = useState(false);
    const [isSelfRegistration, setIsSelfRegistration] = useState(false);
    const [isEstimatedTime, setIsEstimatedTime] = useState(false);
    const [copied, setCopied] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // On récupère l'ID depuis l'URL
    const queueId = useMemo(() => {
        if (typeof params.id === 'string') return params.id;
        if (Array.isArray(params.id)) return params.id[0];
        return '';
    }, [params.id]);

    // Charger la file d'attente
    useEffect(() => {
        if (!queueId) {
            setError("Identifiant de file d'attente invalide");
            setLoading(false);
            return;
        }

        const selectedQueue = queues.find((q) => q.id === queueId);

        if (selectedQueue) {
            setQueue(selectedQueue);
            setCurrentQueue(selectedQueue);
            setIsActive(!!selectedQueue.isActive);
            setIsNotification(selectedQueue.settings?.notificationType?.includes('sms') || false);
            setIsSelfRegistration(selectedQueue.settings?.allowSelfRegistration || false);
            setIsEstimatedTime(selectedQueue.settings?.displayEstimatedWaitTime || false);
        } else {
            setError("File d'attente introuvable");
        }

        setLoading(false);

        // Animation (montage)
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, [queueId, queues, setCurrentQueue]);

    // Filtrer les clients en attente
    const queueWaitingClients = useMemo(() => {
        if (!queueId || !waitingClients) return [];
        return waitingClients.filter((client) => client.queueId === queueId);
    }, [queueId, waitingClients]);

    // Filtrer les clients servis aujourd'hui
    const queueServedToday = useMemo(() => {
        if (!queueId || !servedClientsToday) return [];
        return servedClientsToday.filter((client) => client.queueId === queueId);
    }, [queueId, servedClientsToday]);

    // Progression quotidienne
    const dailyUsagePercentage = useMemo(() => {
        if (!queue || !queue.maxClients) return 0;
        return Math.min(100, ((queue.dailyCounter || 0) / queue.maxClients) * 100);
    }, [queue]);

    // Toggle Actif/Inactif
    const handleToggleActive = useCallback(async () => {
        if (!queue) return;
        try {
            setUpdatingActive(true);

            // Si on désactive la file, on désactive aussi l'auto-inscription
            const updatedSettings = isActive && queue.settings?.allowSelfRegistration
                ? { isActive: false, settings: { ...queue.settings, allowSelfRegistration: false } }
                : { isActive: !isActive };

            await updateQueue(queue.id, updatedSettings);
            setIsActive((prev) => !prev);

            // Si la file est désactivée, on désactive également l'auto-inscription
            if (isActive && isSelfRegistration) {
                setIsSelfRegistration(false);
            }

            toast({
                title: !isActive ? "File d'attente activée" : "File d'attente désactivée",
                description: !isActive
                    ? 'Les clients peuvent maintenant rejoindre cette file'
                    : 'Les inscriptions ont été suspendues',
                variant: !isActive ? 'default' : 'destructive',
            });
        } catch (err) {
            console.error("Erreur lors de l'activation/désactivation:", err);
            toast({
                title: 'Erreur',
                description: "Impossible de modifier l'état de la file",
                variant: 'destructive',
            });
        } finally {
            setUpdatingActive(false);
        }
    }, [queue, isActive, isSelfRegistration, toast, updateQueue]);

    // Copier lien public
    const handleCopyLink = useCallback(() => {
        if (!queue?.publicUrl) return;
        navigator.clipboard.writeText(queue.publicUrl);
        setCopied(true);

        toast({
            title: 'Lien copié !',
            description: "L'URL publique a été copiée dans le presse-papier.",
        });

        setTimeout(() => setCopied(false), 2000);
    }, [queue, toast]);

    // Partager la file
    const handleShare = useCallback(() => {
        if (!queue) return;
        if (navigator.share) {
            navigator
                .share({
                    title: `File d'attente: ${queue.name}`,
                    text: `Rejoignez la file "${queue.name}" via le QR code ou le lien.`,
                    url: queue.publicUrl,
                })
                .catch(() => handleCopyLink());
        } else {
            handleCopyLink();
        }
    }, [queue, handleCopyLink]);

    // Supprimer la file
    const handleDeleteQueue = useCallback(async () => {
        if (!queue) return;
        try {
            await deleteQueue(queue.id);
            toast({
                title: 'File supprimée',
                description: 'La file a été supprimée avec succès',
            });
            router.push('/dashboard/queues');
        } catch (err) {
            console.error("Erreur lors de la suppression de la file:", err);
            toast({
                title: 'Erreur',
                description: 'Impossible de supprimer la file',
                variant: 'destructive',
            });
        }
    }, [queue, deleteQueue, router, toast]);

    // Mise à jour de paramètres
    const updateQueueSettings = useCallback(
        async (settingKey: string, partialSettings: Partial<QueueSettings>) => {
            if (!queue?.settings) return;
            try {
                setUpdatingSettings(settingKey);

                const newSettings: QueueSettings = {
                    ...queue.settings,
                    ...partialSettings,
                };

                await updateQueue(queue.id, { settings: newSettings });

                toast({
                    title: 'Paramètre mis à jour',
                    description: 'Modifié avec succès !',
                });
            } catch (error) {
                console.error('Erreur de mise à jour des paramètres:', error);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de mettre à jour ce paramètre',
                    variant: 'destructive',
                });
            } finally {
                setUpdatingSettings(null);
            }
        },
        [queue, updateQueue, toast]
    );

    // Toggle notifications SMS
    const handleToggleNotifications = useCallback(async () => {
        if (!queue?.settings) return;
        try {
            const notifTypes = queue.settings.notificationType || [];
            const includesSMS = notifTypes.includes('sms');
            const updatedTypes = includesSMS
                ? notifTypes.filter((t) => t !== 'sms')
                : [...notifTypes, 'sms'];

            await updateQueueSettings('sms', { notificationType: updatedTypes });
            // Mettre à jour l'état local après le succès de l'opération
            setIsNotification(!includesSMS);
        } catch (err) {
            console.error("Erreur lors de la mise à jour des notifications:", err);
        }
    }, [queue, updateQueueSettings]);

    // Toggle pour l'auto-inscription
    const handleToggleSelfRegistration = useCallback(async () => {
        if (!queue?.settings) return;

        // Si la file est inactive, on ne peut pas activer l'auto-inscription
        if (!isActive && !isSelfRegistration) {
            toast({
                title: 'Action impossible',
                description: "Vous devez d'abord activer la file d'attente pour permettre l'auto-inscription",
                variant: 'destructive',
            });
            return;
        }

        try {
            await updateQueueSettings('selfReg', {
                allowSelfRegistration: !isSelfRegistration,
            });
            // Mettre à jour l'état local après le succès de l'opération
            setIsSelfRegistration(!isSelfRegistration);
        } catch (err) {
            console.error("Erreur lors de la mise à jour de l'auto-inscription:", err);
        }
    }, [queue, isActive, isSelfRegistration, updateQueueSettings, toast]);

    // Toggle pour l'affichage du temps d'attente estimé
    const handleToggleEstimatedTime = useCallback(async () => {
        if (!queue?.settings) return;
        try {
            await updateQueueSettings('waitTime', {
                displayEstimatedWaitTime: !isEstimatedTime,
            });
            // Mettre à jour l'état local après le succès de l'opération
            setIsEstimatedTime(!isEstimatedTime);
        } catch (err) {
            console.error("Erreur lors de la mise à jour de l'affichage du temps d'attente:", err);
        }
    }, [queue, isEstimatedTime, updateQueueSettings]);

    // Animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 400, damping: 25, mass: 0.5 },
        },
    };

    // Écran de chargement
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Chargement de la file…</p>
            </div>
        );
    }

    // Erreur
    if (error || !queue) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center max-w-md mx-auto mt-8"
            >
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-destructive">Erreur</h2>
                <p className="text-muted-foreground">{error || 'Une erreur est survenue'}</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/queues')}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate={isMounted ? 'visible' : 'hidden'}
            variants={containerVariants}
            className="space-y-4 pb-10"
        >
            {/* BOUTON RETOUR (mobile) */}
            <motion.div
                variants={itemVariants}
                className="md:hidden sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mt-1 py-2"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    className="px-1 mr-auto"
                    onClick={() => router.push('/dashboard/queues')}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Files d&apos;attente
                </Button>
            </motion.div>

            {/* --- EN-TÊTE PLUS COMPACT --- */}
            <motion.div variants={itemVariants}>
                <div className="bg-card rounded-md shadow-sm p-3 border relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Partie gauche : Titre + Description */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-semibold">{queue.name}</h1>
                                <Badge
                                    variant={isActive ? 'gradient' : 'outline'}
                                    className={cn(
                                        'px-2 py-0.5 text-[10px] font-medium tracking-wide',
                                        isActive
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    )}
                                >
                                    {isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs line-clamp-1">
                                {queue.description || 'Aucune description'}
                            </p>
                        </div>

                        {/* Partie droite : Toggle ON/OFF + Boutons de base */}
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                            {/* Toggle plus explicite (ON/OFF) */}
                            <div
                                className={cn(
                                    'relative flex h-6 w-14 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out',
                                    isActive
                                        ? 'border-green-600 bg-green-600'
                                        : 'border-muted-foreground/30 bg-muted'
                                )}
                                onClick={handleToggleActive}
                            >
                                <span className="sr-only">{isActive ? 'Désactiver' : 'Activer'} la file</span>
                                {updatingActive ? (
                                    <Loader2 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white" />
                                ) : (
                                    <>
                                        {/* Pastille blanche */}
                                        <motion.div
                                            className="pointer-events-none h-5 w-5 rounded-full bg-white shadow"
                                            animate={{ x: isActive ? 28 : 2 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                        {/* ON / OFF text */}
                                        <motion.div
                                            className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold text-white"
                                        >
                                            <span>{isActive ? 'ON' : ''}</span>
                                            <span>{!isActive ? 'OFF' : ''}</span>
                                        </motion.div>
                                    </>
                                )}
                            </div>

                            {/* Modifier */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/queues/${queue.id}/edit`)}
                            >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                            </Button>

                            {/* Supprimer (confirmation) */}
                            <Button
                                variant={deleteConfirm ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (deleteConfirm) {
                                        handleDeleteQueue();
                                    } else {
                                        setDeleteConfirm(true);
                                        setTimeout(() => setDeleteConfirm(false), 3000);
                                    }
                                }}
                            >
                                {deleteConfirm ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Confirmer
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        Suppr
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- CARTES STAT --- */}
            <motion.div variants={itemVariants}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* En attente */}
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
                        <CardHeader className="p-2 pb-1">
                            <CardTitle className="text-[11px] font-medium flex items-center">
                                <Users className="h-3 w-3 mr-1 text-primary" />
                                En attente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-1">
                            <div className="text-xl font-bold">{queueWaitingClients.length || 0}</div>
                            <p className="text-[10px] text-muted-foreground">
                                {queueWaitingClients.length > 0
                                    ? `Prochain: ${queueWaitingClients[0].name}`
                                    : 'Aucun client…'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Attente moy. */}
                    <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/10">
                        <CardHeader className="p-2 pb-1">
                            <CardTitle className="text-[11px] font-medium flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                                Attente moy.
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-1">
                            <div className="text-xl font-bold">
                                {queue.stats?.avgWaitTime || 0}
                                <span className="text-sm">m</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Max: {queue.stats?.maxWaitTime || 0}m
                            </p>
                        </CardContent>
                    </Card>

                    {/* Servis */}
                    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/10">
                        <CardHeader className="p-2 pb-1">
                            <CardTitle className="text-[11px] font-medium flex items-center">
                                <Check className="h-3 w-3 mr-1 text-green-500" />
                                Servis auj.
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-1">
                            <div className="text-xl font-bold">{queueServedToday.length || 0}</div>
                            <p className="text-[10px] text-muted-foreground">
                                Total: {queue.stats?.totalServed || 0}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Utilisation */}
                    <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/10">
                        <CardHeader className="p-2 pb-1">
                            <CardTitle className="text-[11px] font-medium flex items-center">
                                <BarChart2 className="h-3 w-3 mr-1 text-accent" />
                                Utilisation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-1">
                            <div className="text-xl font-bold">
                                {queue.dailyCounter || 0}
                                <span className="text-sm">/{queue.maxClients || 0}</span>
                            </div>
                            <div className="w-full bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-1.5 rounded-full transition-all',
                                        dailyUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-accent'
                                    )}
                                    style={{ width: `${dailyUsagePercentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* CONTENU PRINCIPAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Colonne principale */}
                <motion.div variants={itemVariants} className="md:col-span-2 space-y-3">
                    {/* QR Code */}
                    <Card>
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                                <QrCode className="h-4 w-4 text-primary" />
                                QR Code
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                Scannez pour rejoindre
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <div className="border p-2 rounded bg-white dark:bg-white w-[140px] h-[140px] flex items-center justify-center">
                                    <QRCodeSVG
                                        value={queue.publicUrl || ''}
                                        size={130}
                                        bgColor="#FFFFFF"
                                        fgColor="#000000"
                                        level="L"
                                        includeMargin={false}
                                    />
                                </div>
                                <div className="w-full space-y-2">
                                    <label className="text-[11px] font-medium text-muted-foreground">
                                        Lien public
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={queue.publicUrl || ''}
                                            className="flex-1 text-[11px] font-mono"
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className={copied ? 'text-green-500 border-green-500/30' : ''}
                                                        onClick={handleCopyLink}
                                                    >
                                                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Copier</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="sm" onClick={handleShare}>
                                            <Share2 className="h-3.5 w-3.5 mr-1" />
                                            Partager
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/queues/${queue.id}/qrcode`)}
                                        >
                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                            Personnaliser
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Liste des clients en attente (plus compacte) */}
                    <Card>
                        <CardHeader className="p-3 pb-2 flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Users className="h-4 w-4 text-primary" />
                                    Attente
                                </CardTitle>
                                <CardDescription className="text-[11px]">
                                    {queueWaitingClients.length
                                        ? `${queueWaitingClients.length} client${queueWaitingClients.length > 1 ? 's' : ''}`
                                        : 'Aucun client'}
                                </CardDescription>
                            </div>
                            <Button
                                variant="gradient"
                                size="sm"
                                onClick={() => router.push(`/dashboard/clients/add?queueId=${queue.id}`)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Ajouter
                            </Button>
                        </CardHeader>

                        <CardContent className="p-3 pt-1">
                            {!queueWaitingClients.length ? (
                                <div className="text-center py-4 bg-muted/20 rounded">
                                    <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-sm font-medium mb-1">Aucun client</h3>
                                    <p className="text-[10px] text-muted-foreground mb-2 max-w-xs mx-auto">
                                        Ajoutez-en manuellement ou activez l&apos;auto-inscription
                                    </p>
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={() => router.push(`/dashboard/clients/add?queueId=${queue.id}`)}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Ajouter un client
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {queueWaitingClients.slice(0, 6).map((client, index) => (
                                        <motion.div
                                            key={client.id}
                                            className="flex flex-row items-center justify-between p-2 bg-accent/5 hover:bg-accent/10 rounded transition cursor-pointer"
                                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                            whileHover={{ y: -1 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/20 text-primary rounded-full h-6 w-6 flex items-center justify-center text-[11px] font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-medium leading-tight">{client.name}</p>
                                                    <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                                                        <span className="inline-flex items-center gap-0.5">
                                                            <QrCode className="h-3 w-3" />
                                                            {client.token}
                                                        </span>
                                                        <span className="inline-flex items-center gap-0.5">
                                                            <Clock className="h-3 w-3" />
                                                            ~{client.estimatedWaitTime} min
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-[10px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/clients/${client.id}/notify`);
                                                    }}
                                                >
                                                    <Bell className="h-3 w-3 mr-1" />
                                                    Notifier
                                                </Button>
                                                <Button
                                                    variant="gradient"
                                                    size="sm"
                                                    className="h-6 text-[10px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/clients/${client.id}`);
                                                    }}
                                                >
                                                    Servir
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {queueWaitingClients.length > 6 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-2"
                                            onClick={() => router.push(`/dashboard/clients?queueId=${queue.id}`)}
                                        >
                                            Voir tous ({queueWaitingClients.length})
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Colonne de droite */}
                <motion.div variants={itemVariants} className="md:col-span-1 space-y-3">
                    {/* Paramètres rapides */}
                    <Card>
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm flex items-center gap-1">
                                <Settings className="h-4 w-4 text-primary" />
                                Paramètres
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 space-y-3">
                            {/* Notifications SMS */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs">
                                    <p className="font-medium">Notifications SMS</p>
                                    <p className="text-[10px] text-muted-foreground">Alerter par SMS</p>
                                </div>
                                <div
                                    className={cn(
                                        'relative flex h-6 w-14 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out',
                                        isNotification
                                            ? 'border-green-600 bg-green-600'
                                            : 'border-muted-foreground/30 bg-muted'
                                    )}
                                    onClick={handleToggleNotifications}
                                >
                                    <span className="sr-only">
                                        {isNotification ? 'Désactiver' : 'Activer'} les notifications SMS
                                    </span>
                                    {updatingSettings === 'sms' ? (
                                        <Loader2 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <motion.div
                                                className="pointer-events-none h-5 w-5 rounded-full bg-white shadow"
                                                animate={{ x: isNotification ? 28 : 2 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold text-white"
                                            >
                                                <span>{isNotification ? 'ON' : ''}</span>
                                                <span>{!isNotification ? 'OFF' : ''}</span>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Auto-inscription */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs">
                                    <p className="font-medium">Auto-inscription</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {!isActive ? (
                                            <span className="text-yellow-500">Nécessite que la file soit active</span>
                                        ) : (
                                            "Autoriser les clients à s'inscrire"
                                        )}
                                    </p>
                                </div>
                                <div
                                    className={cn(
                                        'relative flex h-6 w-14 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out',
                                        !isActive && !isSelfRegistration
                                            ? 'border-muted-foreground/30 bg-muted/50 cursor-not-allowed'
                                            : isSelfRegistration
                                                ? 'border-green-600 bg-green-600'
                                                : 'border-muted-foreground/30 bg-muted'
                                    )}
                                    onClick={handleToggleSelfRegistration}
                                >
                                    <span className="sr-only">
                                        {isSelfRegistration ? 'Désactiver' : 'Activer'} l'auto-inscription
                                    </span>
                                    {updatingSettings === 'selfReg' ? (
                                        <Loader2 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <motion.div
                                                className="pointer-events-none h-5 w-5 rounded-full bg-white shadow"
                                                animate={{ x: isSelfRegistration ? 28 : 2 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold text-white"
                                            >
                                                <span>{isSelfRegistration ? 'ON' : ''}</span>
                                                <span>{!isSelfRegistration ? 'OFF' : ''}</span>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Temps d'attente estimé */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs">
                                    <p className="font-medium">Temps estimé</p>
                                    <p className="text-[10px] text-muted-foreground">Le montrer aux clients</p>
                                </div>
                                <div
                                    className={cn(
                                        'relative flex h-6 w-14 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out',
                                        isEstimatedTime
                                            ? 'border-green-600 bg-green-600'
                                            : 'border-muted-foreground/30 bg-muted'
                                    )}
                                    onClick={handleToggleEstimatedTime}
                                >
                                    <span className="sr-only">
                                        {isEstimatedTime ? 'Masquer' : 'Afficher'} le temps d'attente
                                    </span>
                                    {updatingSettings === 'waitTime' ? (
                                        <Loader2 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <motion.div
                                                className="pointer-events-none h-5 w-5 rounded-full bg-white shadow"
                                                animate={{ x: isEstimatedTime ? 28 : 2 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold text-white"
                                            >
                                                <span>{isEstimatedTime ? 'ON' : ''}</span>
                                                <span>{!isEstimatedTime ? 'OFF' : ''}</span>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-3 pt-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => router.push(`/dashboard/queues/${queue.id}/settings`)}
                            >
                                Tous les paramètres
                                <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Actions rapides */}
                    <Card>
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm flex items-center gap-1">
                                <ArrowRight className="h-4 w-4 text-primary" />
                                Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 space-y-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => router.push(`/dashboard/clients/add?queueId=${queue.id}`)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Ajouter un client
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => router.push(`/dashboard/queues/${queue.id}/notifications`)}
                            >
                                <Bell className="h-3.5 w-3.5 mr-1" />
                                Envoyer une notif
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => router.push(`/dashboard/statistics?queueId=${queue.id}`)}
                            >
                                <BarChart2 className="h-3.5 w-3.5 mr-1" />
                                Statistiques
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={handleShare}
                            >
                                <Share2 className="h-3.5 w-3.5 mr-1" />
                                Partager
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Statut de la file (desktop) */}
                    <Card className="hidden md:block bg-gradient-to-br from-muted/30 to-muted/10">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm flex items-center gap-1">
                                <LinkIcon className="h-4 w-4 text-primary" />
                                Statut
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">État actuel</span>
                                <Badge
                                    variant={isActive ? 'gradient' : 'outline'}
                                    className={isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                >
                                    {isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            {!isActive && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded p-2 text-xs">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">File d'attente inactive</p>
                                            <p className="text-[10px] opacity-80 mt-0.5">
                                                Les clients ne peuvent pas s'inscrire lorsque la file est inactive.
                                                Activez la file pour permettre les inscriptions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Auto-inscription</span>
                                <Badge variant={isSelfRegistration ? 'gradient' : 'outline'}>
                                    {isSelfRegistration ? 'Activée' : 'Désactivée'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Notifications</span>
                                <div className="flex gap-1">
                                    {queue.settings?.notificationType?.includes('email') && (
                                        <Badge variant="outline" className="bg-muted/30">
                                            Email
                                        </Badge>
                                    )}
                                    {isNotification && (
                                        <Badge variant="outline" className="bg-muted/30">
                                            SMS
                                        </Badge>
                                    )}
                                    {(!queue.settings?.notificationType ||
                                        queue.settings.notificationType.length === 0) && !isNotification && (
                                            <Badge variant="outline">Aucune</Badge>
                                        )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
