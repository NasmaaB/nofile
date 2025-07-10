// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Importation des composants depuis leurs fichiers
import { ClientSuccessView } from './components/ClientSuccessView';
import { WaitingClientsList } from './components/WaitingClientsList';
import { JoinQueueForm } from './components/JoinQueueForm';
import { CancelView } from './components/CancelView';
import { QueueInfoCard } from './components/QueueInfoCard';

// Types
import type { Queue, Client } from '@/types/types';

// Hook personnalisé pour les requêtes média
const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const media = window.matchMedia(query);
            if (media.matches !== matches) {
                setMatches(media.matches);
            }

            const listener = () => setMatches(media.matches);
            media.addEventListener('change', listener);

            return () => media.removeEventListener('change', listener);
        }
        return undefined;
    }, [matches, query]);

    return matches;
};

export default function QueuePage() {
    const router = useRouter();
    const params = useParams();
    const queueId = Array.isArray(params.queueId) ? params.queueId[0] : params.queueId;
    const [activeTab, setActiveTab] = useState<string>('join');
    const [isLoading, setIsLoading] = useState(true);
    const [queue, setQueue] = useState(null);
    const [waitingClients, setWaitingClients] = useState([]);
    const [clientState, setClientState] = useState<{
        isRegistered: boolean;
        client?: Client;
        position?: number;
        isDeleting: boolean;
        isDeleted: boolean;
        error: string;
    }>({
        isRegistered: false,
        client: undefined,
        position: undefined,
        isDeleting: false,
        isDeleted: false,
        error: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Récupérer les informations de la file d'attente
    useEffect(() => {
        const fetchQueue = async () => {
            if (!queueId) return;

            try {
                const queueRef = doc(db, 'queues', queueId);
                const queueSnap = await getDoc(queueRef);

                if (queueSnap.exists()) {
                    setQueue({
                        id: queueSnap.id,
                        ...queueSnap.data()
                    });
                } else {
                    toast({
                        title: "File d'attente introuvable",
                        description: "La file d'attente demandée n'existe pas.",
                        variant: "destructive"
                    });
                    router.push('/');
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de la file d'attente:", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger la file d'attente.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchQueue();
    }, [queueId, router, toast]);

    // Écouter les clients en attente
    useEffect(() => {
        if (!queueId) return;

        const clientsRef = collection(db, 'clients');
        const clientsQuery = query(
            clientsRef,
            where('queueId', '==', queueId),
            where('status', '==', 'waiting'),
            orderBy('position', 'asc')
        );

        const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
            const clients = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setWaitingClients(clients);

            // Vérifier si notre client est toujours dans la liste
            if (clientState.clientId) {
                const ourClient = clients.find(c => c.id === clientState.clientId);

                if (ourClient) {
                    setClientState(prev => ({
                        ...prev,
                        client: ourClient
                    }));
                } else if (clientState.isRegistered) {
                    // Notre client n'est plus dans la liste, peut-être a-t-il été servi
                    setClientState({
                        isRegistered: false,
                        client: null,
                        clientId: null,
                        secretKey: null,
                        position: undefined
                    });

                    // Afficher une notification
                    toast({
                        title: "Vous avez été servi",
                        description: "Votre tour est passé, merci d'avoir utilisé notre service.",
                        variant: "default"
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [queueId, clientState.clientId, clientState.isRegistered, toast]);

    // Vérifier si le client a déjà rejoint la file d'attente (depuis le localStorage)
    useEffect(() => {
        if (typeof window === 'undefined' || !queueId) return;

        try {
            const savedClient = localStorage.getItem(`queue_${queueId}_client`);

            if (savedClient) {
                const parsedClient = JSON.parse(savedClient);

                if (parsedClient) {
                    setClientState({
                        isRegistered: true,
                        client: parsedClient,
                        position: parsedClient.position,
                        isDeleting: false,
                        isDeleted: false,
                        error: "",
                    });
                    setActiveTab("join");
                }
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du client:", error);
        }
    }, [queueId]);

    // Gestionnaire de soumission du formulaire d'inscription
    const handleJoinQueue = async (data) => {
        if (!queue) {
            return { success: false, message: "Impossible de rejoindre la file d'attente." };
        }

        setIsSubmitting(true);

        try {
            // Normaliser les données pour la vérification
            const normalizedName = data.name.toLowerCase().trim();
            const normalizedEmail = data.email ? data.email.toLowerCase().trim() : '';

            // Vérifier les doublons
            console.log("Vérification des doublons pour:", {
                name: normalizedName,
                email: data.emailNotifications ? normalizedEmail : "désactivé",
                phone: data.smsNotifications ? data.phone : "désactivé",
                emailNotif: data.emailNotifications,
                smsNotif: data.smsNotifications
            });

            console.log("Clients existants:", waitingClients.map(c => ({
                name: c.name.toLowerCase().trim(),
                email: c.email ? c.email.toLowerCase().trim() : '',
                phone: c.phone
            })));

            const duplicateCheck = waitingClients.some(client => {
                // Toujours vérifier le nom
                const clientName = client.name.toLowerCase().trim();
                if (clientName === normalizedName) {
                    console.log("Doublon trouvé - Nom:", client.name, "vs", normalizedName);
                    return true;
                }

                // Vérifier l'email uniquement si email notifications est activé
                if (data.emailNotifications && normalizedEmail && client.email) {
                    const clientEmail = client.email.toLowerCase().trim();
                    if (clientEmail === normalizedEmail) {
                        console.log("Doublon trouvé - Email:", clientEmail, "vs", normalizedEmail);
                        return true;
                    }
                }

                // Vérifier le téléphone uniquement si sms notifications est activé
                if (data.smsNotifications && data.phone && client.phone &&
                    client.phone === data.phone) {
                    console.log("Doublon trouvé - Téléphone:", client.phone, "vs", data.phone);
                    return true;
                }

                return false;
            });

            if (duplicateCheck) {
                toast({
                    title: "Client déjà présent",
                    description: "Un client avec le même nom est déjà dans la file d'attente.",
                    variant: "destructive"
                });

                return { success: false, duplicateFound: true };
            }

            // Génération d'un token de 4 chiffres
            const token = Math.floor(1000 + Math.random() * 9000);

            // Génération d'une clé secrète aléatoire (5 caractères alphanumériques)
            const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let secretKey = '';
            for (let i = 0; i < 5; i++) {
                secretKey += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            // Calcul de la position et du temps d'attente estimé
            const position = waitingClients.length + 1;
            const estimatedWaitTime = position * (queue.averageServiceTime || 5);

            // Préparation des données client à envoyer
            const clientData = {
                name: data.name.trim(),
                email: data.email.trim(),
                phone: data.phone || "",
                queueId,
                position,
                token,
                secretKey,
                smsNotifications: Boolean(data.smsNotifications),
                emailNotifications: Boolean(data.emailNotifications),
                estimatedWaitTime,
                createdAt: Date.now()
            };

            console.log("Envoi des données client:", clientData);

            // Utilisation de l'API REST pour enregistrer le client
            const apiUrl = '/api/clients'; // Chemin relatif au domaine courant

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientData)
                });

                console.log("Statut de la réponse API:", response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Erreur API (${response.status}):`, errorText);

                    toast({
                        title: `Erreur ${response.status}`,
                        description: `Problème de communication avec le serveur: ${response.statusText}`,
                        variant: "destructive"
                    });

                    return {
                        success: false,
                        message: `Erreur ${response.status}: ${response.statusText}`
                    };
                }

                const result = await response.json();
                console.log("Réponse API:", result);

                if (result.success) {
                    const newClient = result.client;

                    // Stocker les informations du client dans le localStorage
                    localStorage.setItem(
                        `queue_${queueId}_client`,
                        JSON.stringify({
                            ...newClient,
                            id: newClient.id,
                            position: position
                        })
                    );

                    // Mettre à jour l'état et afficher la vue de succès
                    setClientState({
                        isRegistered: true,
                        client: { ...newClient, id: newClient.id },
                        position: position,
                        isDeleting: false,
                        isDeleted: false,
                        error: "",
                    });

                    // Forcer le changement d'onglet
                    setActiveTab('join');

                    toast({
                        title: "Inscription réussie",
                        description: "Vous avez rejoint la file d'attente avec succès.",
                        variant: "default"
                    });

                    return { success: true };
                } else {
                    toast({
                        title: "Erreur",
                        description: result.message || "Une erreur s'est produite lors de l'inscription.",
                        variant: "destructive"
                    });

                    return { success: false, message: result.message };
                }
            } catch (apiError) {
                console.error("Erreur API:", apiError);

                toast({
                    title: "Erreur de connexion",
                    description: "Impossible de communiquer avec le serveur. Vérifiez votre connexion et réessayez.",
                    variant: "destructive"
                });

                return { success: false, message: "Erreur de connexion au serveur." };
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);

            toast({
                title: "Erreur",
                description: "Une erreur s'est produite lors de l'inscription.",
                variant: "destructive"
            });

            return { success: false, message: "Erreur technique lors de l'inscription." };
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gestionnaire d'annulation d'inscription
    const handleCancelRegistration = async (name, secretKey) => {
        try {
            const response = await fetch('/api/clients/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    secretKey,
                    queueId
                })
            });

            const result = await response.json();

            if (result.success) {
                // Si c'est notre client qui a été annulé, effacer les données locales
                if (clientState.isRegistered && clientState.secretKey === secretKey) {
                    localStorage.removeItem(`queue_${queueId}_client`);

                    setClientState({
                        isRegistered: false,
                        client: undefined,
                        position: undefined,
                        isDeleting: false,
                        isDeleted: true,
                        error: "",
                    });

                    // Revenir à l'onglet d'inscription
                    setActiveTab('join');
                }

                toast({
                    title: "Désinscription réussie",
                    description: "Vous avez été désinscrit de la file d'attente avec succès.",
                    variant: "default"
                });

                return {
                    success: true,
                    message: "Vous avez été désinscrit de la file d'attente.",
                    client: result.client
                };
            } else {
                toast({
                    title: "Erreur",
                    description: result.message || "Impossible de traiter votre désinscription.",
                    variant: "destructive"
                });

                return { success: false, message: result.message || "Vérifiez vos informations et réessayez." };
            }
        } catch (error) {
            console.error("Erreur lors de la désinscription:", error);

            toast({
                title: "Erreur",
                description: "Une erreur s'est produite lors de la désinscription.",
                variant: "destructive"
            });

            return { success: false, message: "Erreur technique lors de la désinscription." };
        }
    };

    // Réinitialiser l'état du client (pour se déconnecter)
    const handleReset = useCallback(() => {
        if (clientState.isRegistered) {
            localStorage.removeItem(`queue_${queueId}_client`);

            setClientState({
                isRegistered: false,
                client: undefined,
                position: undefined,
                isDeleting: false,
                isDeleted: false,
                error: "",
            });

            setActiveTab('join');

            toast({
                title: "Déconnexion réussie",
                description: "Vous êtes maintenant déconnecté de la file d'attente.",
                variant: "default"
            });
        }
    }, [clientState.isRegistered, queueId]);

    // Vérifier si la file est presque pleine (80% de capacité)
    const isQueueNearlyFull = useMemo(() => {
        if (!queue || typeof queue.maxClients !== 'number') return false;
        return waitingClients.length >= Math.floor(queue.maxClients * 0.8);
    }, [queue, waitingClients.length]);

    // Vérifier si la file est complètement pleine
    const isQueueFull = useMemo(() => {
        if (!queue || typeof queue.maxClients !== 'number') return false;
        return waitingClients.length >= queue.maxClients;
    }, [queue, waitingClients.length]);

    // Si la page est en cours de chargement
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-lg">Chargement de la file d'attente...</p>
            </div>
        );
    }

    // Si la file d'attente n'existe pas
    if (!queue) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-destructive text-lg mb-2">File d'attente introuvable</p>
                <p className="text-muted-foreground">La file d'attente demandée n'existe pas ou a été supprimée.</p>
            </div>
        );
    }

    return (
        <main className="container max-w-4xl px-4 py-8">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : clientState.error ? (
                <div className="text-center">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{clientState.error}</AlertDescription>
                    </Alert>
                </div>
            ) : (
                <Tabs
                    defaultValue="join"
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as string)}
                    className="space-y-6"
                >
                    <TabsList className="grid grid-cols-3 w-full mb-4">
                        <TabsTrigger value="join" className="text-sm sm:text-base">
                            Rejoindre
                        </TabsTrigger>
                        <TabsTrigger value="waiting" className="text-sm sm:text-base">
                            File d'attente
                        </TabsTrigger>
                        <TabsTrigger value="cancel" className="text-sm sm:text-base">
                            Se désinscrire
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="join" className="space-y-8 focus-visible:outline-none">
                        {clientState.isRegistered ? (
                            <Suspense fallback={<div>Chargement...</div>}>
                                {/* @ts-ignore */}
                                <ClientSuccessView
                                    client={clientState.client}
                                    position={clientState.position}
                                    onReset={handleReset}
                                    queue={queue}
                                    waitingClients={waitingClients}
                                />
                            </Suspense>
                        ) : (
                            <>
                                <QueueInfoCard queue={queue} waitingClients={waitingClients} />

                                <JoinQueueForm
                                    queue={queue}
                                    waitingClients={waitingClients}
                                    onSubmit={handleJoinQueue}
                                    isLoading={isSubmitting}
                                />
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="waiting" className="space-y-8 focus-visible:outline-none">
                        <QueueInfoCard queue={queue} waitingClients={waitingClients} />

                        <Suspense fallback={<div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>}>
                            <WaitingClientsList
                                clients={waitingClients}
                                currentClientId={clientState.client?.id}
                                queue={queue}
                            />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="cancel" className="space-y-8 focus-visible:outline-none">
                        <CancelView
                            onCancel={handleCancelRegistration}
                            onReset={handleReset}
                        />
                    </TabsContent>
                </Tabs>
            )}
        </main>
    );
}
