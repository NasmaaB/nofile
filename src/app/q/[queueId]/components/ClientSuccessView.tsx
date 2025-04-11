'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    ArrowDownUp,
    CheckCircle,
    Info,
    KeyRound,
    Loader2,
    Mail,
    Phone,
    RefreshCw,
    X,
    Clock,
    Users,
    Shield,
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
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { doc, deleteDoc, query, collection, where, getDocs, updateDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';
import { Queue, Client } from '@/types/types';
import { cn } from '@/lib/utils';

interface ClientViewProps {
    client: Client;
    position?: number;
    onReset: () => void;
    queue: Queue;
    waitingClients: Client[];
}

export function ClientSuccessView({ client, position, onReset, queue, waitingClients }: ClientViewProps) {
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [clientState, setClientState] = useState<Client>(client);
    const [isSendingNotif, setIsSendingNotif] = useState<'email' | 'sms' | null>(null);
    const [isShimmering, setIsShimmering] = useState(false);

    // Utiliser la position passée comme prop ou celle du client
    const clientPosition = position !== undefined ? position : client?.position;

    // Animation pulsée pour le numéro de ticket
    const pulseAnimation = {
        initial: { scale: 1 },
        animate: {
            scale: [1, 1.07, 1],
            transition: {
                repeat: Infinity,
                repeatType: "reverse" as const,
                duration: 2.5,
                ease: "easeInOut"
            }
        }
    };

    // Effect visuel de scintillement pour le numéro de ticket
    useEffect(() => {
        const interval = setInterval(() => {
            setIsShimmering(true);
            setTimeout(() => setIsShimmering(false), 2000);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Fonction de désinscription : supprime le client et met à jour la file
    const handleDeregister = async () => {
        if (!clientState?.id) return;
        setDeleting(true);
        try {
            const clientRef = doc(db, 'clients', clientState.id);
            await deleteDoc(clientRef);

            // Réorganiser les positions des clients après la suppression
            const clientsAfterQuery = query(
                collection(db, 'clients'),
                where('queueId', '==', queue.id),
                where('status', '==', 'waiting'),
                where('position', '>', clientState.position || 0)
            );
            const snapshot = await getDocs(clientsAfterQuery);
            const batch = writeBatch(db);
            snapshot.forEach(doc => {
                batch.update(doc.ref, { position: increment(-1) });
            });
            await batch.commit();

            // Mettre à jour l'horodatage de la file
            const queueRef = doc(db, 'queues', queue.id);
            await updateDoc(queueRef, { updatedAt: serverTimestamp() });

            toast({
                title: "Désinscription réussie",
                description: "Vous avez été retiré de la file d'attente",
                variant: "success"
            });

            onReset();
        } catch (error) {
            console.error("Erreur lors de la désinscription:", error);
            toast({
                title: "Échec de la désinscription",
                description: "Une erreur est survenue lors de la désinscription",
                variant: "destructive"
            });
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Fonction pour envoyer un email de rappel
    const sendEmailReminder = async () => {
        if (!clientState.email) {
            toast({
                title: "Envoi impossible",
                description: "Aucune adresse email n'a été fournie",
                variant: "destructive"
            });
            return;
        }
        setIsSendingNotif('email');
        try {
            const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/q/${queue.id}/cancel/${clientState.clientUid}`;
            await sendEmail({
                to: clientState.email,
                subject: `Votre ticket pour ${queue.name}`,
                text: `Bonjour ${clientState.name},\n\nVoici les détails de votre ticket :\n\nNuméro : ${clientState.token}\nPosition : ${clientState.position}\nTemps d'attente estimé : ~${clientState.estimatedWaitTime} minutes\nClé secrète : ${clientState.secretKey}\n\nPour annuler votre ticket : ${cancelUrl}\n\nMerci de votre patience.`,
                html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 8px;">Votre ticket pour ${queue.name}</h1>
              <p style="color: #64748b; font-size: 16px;">Conservez ces informations pour suivre votre position</p>
            </div>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <div style="text-align: center; margin-bottom: 15px;">
                <span style="background-color: #0ca5e9; color: white; padding: 8px 16px; border-radius: 9999px; font-size: 20px; font-weight: bold;">${clientState.token}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <div style="text-align: center; flex: 1;">
                  <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Position</p>
                  <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 0;">${clientState.position}</p>
                </div>
                <div style="text-align: center; flex: 1;">
                  <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Attente estimée</p>
                  <p style="color: #0f172a; font-size: 18px; font-weight: bold; margin: 0;">~${clientState.estimatedWaitTime} min</p>
                </div>
              </div>
            </div>
            <div style="background-color: #f0f9ff; border-radius: 8px; padding: 15px; margin-bottom: 20px; border: 1px solid #b9e6fe;">
              <p style="color: #0369a1; font-size: 14px; margin-bottom: 8px; font-weight: bold;">Votre clé secrète de désinscription :</p>
              <p style="color: #0c4a6e; font-size: 22px; font-weight: bold; text-align: center; letter-spacing: 1px; margin: 0;">${clientState.secretKey}</p>
              <p style="color: #0369a1; font-size: 12px; margin-top: 8px; text-align: center;">Conservez cette clé pour pouvoir vous désinscrire si nécessaire</p>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Si vous souhaitez vous désinscrire, <a href="${cancelUrl}" style="color: #0ca5e9; text-decoration: none; font-weight: bold;">cliquez ici</a> ou utilisez votre clé secrète dans l'onglet "Désinscription".</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">Merci d'utiliser notre service</p>
            </div>
          </div>
        `
            });
            toast({
                title: "Email envoyé",
                description: "Le rappel a été envoyé à votre adresse email",
                variant: "success"
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi du mail:", error);
            toast({
                title: "Échec de l'envoi",
                description: "Impossible d'envoyer l'email de rappel",
                variant: "destructive"
            });
        } finally {
            setIsSendingNotif(null);
        }
    };

    // Envoyer un SMS de rappel
    const sendSmsReminder = async () => {
        if (!clientState.phone) {
            toast({
                title: "Envoi impossible",
                description: "Aucun numéro de téléphone n'a été fourni",
                variant: "destructive"
            });
            return;
        }
        setIsSendingNotif('sms');
        try {
            const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/q/${queue.id}/cancel/${clientState.clientUid}`;
            await sendSMS({
                to: clientState.phone,
                message: `${queue.name}: Ticket N°${clientState.token}, Pos: ${clientState.position}, Attente: ~${clientState.estimatedWaitTime}min. Clé: ${clientState.secretKey}. Annuler: ${cancelUrl}`
            });
            toast({
                title: "SMS envoyé",
                description: "Le rappel a été envoyé à votre téléphone",
                variant: "success"
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi du SMS:", error);
            toast({
                title: "Échec de l'envoi",
                description: "Impossible d'envoyer le SMS de rappel",
                variant: "destructive"
            });
        } finally {
            setIsSendingNotif(null);
        }
    };

    // Mettre à jour les données du client si elles changent dans la liste
    useEffect(() => {
        const updatedClient = waitingClients.find(c => c.id === clientState.id);
        if (updatedClient) {
            setClientState(updatedClient);
        }
    }, [waitingClients, clientState.id]);

    // Animations pour les différentes sections
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.3,
                when: "afterChildren",
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md mx-auto"
        >
            <Card className="border-nofile-300 shadow-lg rounded-xl overflow-hidden">
                {/* En-tête avec layout optimisé */}
                <CardHeader className="pb-2 pt-3 bg-gradient-to-r from-nofile-100 to-nofile-50 dark:from-nofile-900/40 dark:to-nofile-800/30 relative overflow-hidden">
                    {/* Effet de cercles en arrière-plan */}
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        <div className="absolute -top-8 -left-8 w-20 h-20 rounded-full bg-nofile-300/50"></div>
                        <div className="absolute top-12 -right-8 w-28 h-28 rounded-full bg-nofile-200/50"></div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-14 h-14 bg-nofile-100 dark:bg-nofile-800 rounded-full flex items-center justify-center shadow-sm relative z-10"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <motion.div
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: 1, delay: 0.5 }}
                            >
                                <CheckCircle className="h-7 w-7 text-nofile-600 dark:text-nofile-300" />
                            </motion.div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="text-left">
                            <CardTitle className="text-lg font-bold text-nofile-800 dark:text-nofile-100">Inscription confirmée</CardTitle>
                            <CardDescription className="text-sm text-nofile-700 dark:text-nofile-200">
                                File <span className="font-medium text-nofile-600 dark:text-nofile-300">{queue.name}</span>
                            </CardDescription>
                        </motion.div>
                    </div>
                </CardHeader>

                <CardContent className="px-4 py-3 space-y-3">
                    {/* Section numéro et clé */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Numéro de ticket */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-nofile-50/50 dark:bg-nofile-900/20 rounded-xl p-2.5 border border-nofile-200 dark:border-nofile-800/50 shadow-sm"
                        >
                            <div className="text-center">
                                <span className="text-xs text-nofile-700 dark:text-nofile-300 uppercase font-medium tracking-wider">
                                    Votre numéro
                                </span>
                                <div className="relative mt-1">
                                    <motion.div
                                        className={`text-4xl font-bold inline-block relative
                                            ${isShimmering ? "text-transparent bg-clip-text bg-gradient-to-r from-nofile-500 via-nofile-400 to-nofile-500" : "text-nofile-600 dark:text-nofile-300"}`}
                                        {...pulseAnimation}
                                    >
                                        {clientState.token}

                                        {/* Badge d'état */}
                                        <div className="absolute -top-1 -right-2">
                                            <Badge className="bg-nofile-accent-50 text-nofile-accent-600 border-nofile-accent-200 text-xs font-normal dark:bg-nofile-accent-900/20 dark:border-nofile-accent-800 dark:text-nofile-accent-300 px-1 py-0">
                                                Actif
                                            </Badge>
                                        </div>

                                        {/* Effet de lueur */}
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-nofile-400/40 to-transparent blur-sm"></div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Clé secrète */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-xl overflow-hidden relative"
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        >
                            <div className="bg-gradient-to-r from-nofile-100 to-nofile-50 dark:from-nofile-800/40 dark:to-nofile-900/30 border border-nofile-200 dark:border-nofile-700/30 rounded-xl p-2.5 h-full relative overflow-hidden shadow-sm">
                                <div className="text-center relative z-10">
                                    <div className="flex items-center justify-center">
                                        <Shield className="h-3.5 w-3.5 text-nofile-600 dark:text-nofile-300 mr-1" />
                                        <span className="text-xs text-nofile-700 dark:text-nofile-400 uppercase font-medium tracking-wider">
                                            Clé secrète
                                        </span>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-nofile-800 dark:text-nofile-200 tracking-wider mt-1">
                                        {clientState.secretKey}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Position et temps d'attente */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                        <div className="bg-nofile-50 dark:bg-nofile-900/20 p-2.5 rounded-xl flex flex-col items-center border border-nofile-100 dark:border-nofile-800/50 relative overflow-hidden group">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Users className="h-4 w-4 text-nofile-600 dark:text-nofile-300" />
                                <span className="text-xs text-nofile-700 dark:text-nofile-400">Position</span>
                            </div>
                            <span className="text-2xl font-semibold text-nofile-800 dark:text-nofile-200">{clientPosition || '-'}</span>
                            <span className="text-xs text-nofile-600 dark:text-nofile-400 mt-0.5 text-center">
                                {(clientPosition || 0) === 1 ? (
                                    "Vous êtes le prochain"
                                ) : (
                                    `${(clientPosition || 0) - 1} ${(clientPosition || 0) - 1 > 1 ? 'personnes' : 'personne'} avant vous`
                                )}
                            </span>
                        </div>

                        <div className="bg-nofile-50 dark:bg-nofile-900/20 p-2.5 rounded-xl flex flex-col items-center border border-nofile-100 dark:border-nofile-800/50 relative overflow-hidden group">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="h-4 w-4 text-nofile-600 dark:text-nofile-300" />
                                <span className="text-xs text-nofile-700 dark:text-nofile-400">Temps d'attente</span>
                            </div>
                            <span className="text-2xl font-semibold text-nofile-800 dark:text-nofile-200">~{clientState.estimatedWaitTime} min</span>
                            <span className="text-xs text-nofile-600 dark:text-nofile-400 mt-0.5 text-center">Basé sur l'historique</span>
                        </div>
                    </motion.div>

                    {/* Information simplifiée */}
                    <motion.div
                        variants={itemVariants}
                        className="relative"
                    >
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/10 rounded-xl p-2.5 shadow-sm">
                            <div className="flex gap-2.5">
                                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    <span className="font-medium">Gardez cette page ouverte</span> pour suivre votre position. Vous pouvez recevoir votre ticket par email ou SMS.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Boutons d'action */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-2">
                            {/* Boutons d'envoi */}
                            <div className="flex gap-2">
                                {clientState.email && (
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-nofile-600 hover:bg-nofile-700 text-white h-9"
                                        onClick={sendEmailReminder}
                                        disabled={isSendingNotif !== null}
                                    >
                                        {isSendingNotif === 'email' ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Mail className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                )}
                                {clientState.phone && (
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-nofile-600 hover:bg-nofile-700 text-white h-9"
                                        onClick={sendSmsReminder}
                                        disabled={isSendingNotif !== null}
                                    >
                                        {isSendingNotif === 'sms' ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Phone className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Bouton Actualiser */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-nofile-300 text-nofile-700 hover:bg-nofile-100 dark:border-nofile-700 dark:text-nofile-300 dark:hover:bg-nofile-800/50 h-9"
                                onClick={() => window.location.reload()}
                                disabled={deleting}
                            >
                                <ArrowDownUp className="h-3.5 w-3.5 mr-1.5" />
                                <span>Actualiser</span>
                            </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {/* Bouton Nouvelle inscription */}
                            <Button
                                size="sm"
                                className="bg-nofile-500 hover:bg-nofile-600 text-white h-9"
                                onClick={onReset}
                                disabled={deleting}
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                <span>Nouvelle inscription</span>
                            </Button>

                            {/* Bouton Désinscription */}
                            <Button
                                size="sm"
                                className="bg-nofile-accent-600 hover:bg-nofile-accent-700 text-white h-9"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={deleting}
                            >
                                <X className="h-3.5 w-3.5 mr-1.5" />
                                <span>Se désinscrire</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>

                {/* Modal de confirmation */}
                <AnimatePresence>
                    {showDeleteDialog && (
                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <DialogContent className="sm:max-w-md border-nofile-200 dark:border-nofile-800">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <DialogHeader>
                                        <DialogTitle className="text-nofile-800 dark:text-nofile-200">Confirmer la désinscription</DialogTitle>
                                        <DialogDescription className="text-nofile-700 dark:text-nofile-300">
                                            Êtes-vous sûr de vouloir vous retirer de la file d'attente ? Cette action est irréversible.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-3 py-3">
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: 0.1 }}
                                            className="p-3 border border-nofile-200 dark:border-nofile-800 rounded-lg bg-nofile-50 dark:bg-nofile-900/20"
                                        >
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                                                <div>
                                                    <p className="text-nofile-600 dark:text-nofile-400 text-xs">Nom</p>
                                                    <p className="font-medium text-nofile-800 dark:text-nofile-200">{clientState?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-nofile-600 dark:text-nofile-400 text-xs">Numéro</p>
                                                    <p className="font-medium text-nofile-800 dark:text-nofile-200">{clientState?.token}</p>
                                                </div>
                                                <div>
                                                    <p className="text-nofile-600 dark:text-nofile-400 text-xs">Position</p>
                                                    <p className="font-medium text-nofile-800 dark:text-nofile-200">{clientState?.position}</p>
                                                </div>
                                                <div>
                                                    <p className="text-nofile-600 dark:text-nofile-400 text-xs">Attente</p>
                                                    <p className="font-medium text-nofile-800 dark:text-nofile-200">~{clientState?.estimatedWaitTime} min</p>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: 0.2 }}
                                            className="bg-nofile-accent-50 text-nofile-accent-700 dark:bg-nofile-accent-900/20 dark:text-nofile-accent-300 rounded-lg p-3 text-xs flex items-start"
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-nofile-accent-600 dark:text-nofile-accent-400" />
                                            <p>Une fois retiré, vous devrez vous réinscrire et serez placé à la fin de la file.</p>
                                        </motion.div>
                                    </div>
                                    <DialogFooter className="sm:justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-nofile-300 text-nofile-700 hover:bg-nofile-100 dark:border-nofile-700 dark:text-nofile-300 dark:hover:bg-nofile-800/50"
                                            onClick={() => setShowDeleteDialog(false)}
                                            disabled={deleting}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-nofile-accent-600 hover:bg-nofile-accent-700 text-white"
                                            onClick={handleDeregister}
                                            disabled={deleting}
                                        >
                                            {deleting ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                                    <span>Suppression...</span>
                                                </>
                                            ) : (
                                                "Confirmer"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </motion.div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}