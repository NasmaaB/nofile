'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDocs,
    orderBy,
    limit,
    getDoc,
    increment,
    Timestamp,
    type Firestore,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { Queue, Client, QueueSettings, QueueStats } from '@/types';
import { generateId, calculateQueueStats, calculateWaitingTime, timestampToDate } from '@/lib/utils';
import { differenceInMinutes } from 'date-fns';
import { logError } from '@/lib/logging';

// Interface étendue pour QueueSettings avec activeServers
interface QueueSettingsWithServers extends QueueSettings {
    activeServers?: number;
}

// Interface étendue pour Queue avec le settings modifié
interface QueueWithServers extends Omit<Queue, 'settings'> {
    settings?: QueueSettingsWithServers;
}

// Interface étendue pour Client avec des dates explicites
interface ClientWithDates extends Client {
    joinedAt: any;
    servedAt?: any;
    createdAt: any;
    updatedAt?: any;
}

interface LoadingState {
    queues?: boolean;
    clients?: boolean;
    currentQueue?: boolean;
    updatingEstimates?: boolean;
}

export interface QueueContextType {
    queues: Queue[];
    currentQueue: Queue | null;
    clients: Client[];
    waitingClients: Client[];
    servedClients: Client[];
    canceledClients: Client[];
    loading: boolean;
    error: string | null;
    createQueue: (data: Partial<Queue>) => Promise<string>;
    updateQueue: (id: string, data: Partial<Queue>) => Promise<void>;
    deleteQueue: (id: string) => Promise<void>;
    setCurrentQueue: (queue: Queue | null) => void;
    addClient: (data: Partial<Client>) => Promise<string>;
    updateClient: (id: string, data: Partial<Client>) => Promise<void>;
    callNextClient: () => Promise<Client | null>;
    serveClient: (id: string) => Promise<void>;
    cancelClient: (id: string) => Promise<void>;
    markNoShow: (id: string) => Promise<void>;
    getClient: (id: string) => Promise<Client | null>;
    getQueue: (id: string) => Promise<Queue | null>;
    getQueueStats: (queueId: string) => Promise<QueueStats>;
    deleteClient: (id: string) => Promise<void>;
    clearQueue: () => Promise<void>;
    updateWaitingTimesEstimates: (queueId?: string) => Promise<boolean>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [queues, setQueues] = useState<Queue[]>([]);
    const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasReachedClientLimit, setHasReachedClientLimit] = useState(false);

    // Charger les files d'attente de l'utilisateur
    useEffect(() => {
        if (!user || !db) {
            setQueues([]);
            setLoading(false);
            return () => { }; // Fonction de nettoyage vide
        }

        setLoading(true);
        const queuesRef = collection(db, 'queues');
        const q = query(queuesRef, where('ownerId', '==', user.id), orderBy('createdAt', 'desc'));

        // Définir unsubscribe comme une fonction vide par défaut
        let unsubscribe = () => { };

        try {
            unsubscribe = onSnapshot(q, (snapshot) => {
                const queueList: Queue[] = [];

                snapshot.forEach((doc) => {
                    queueList.push({
                        id: doc.id,
                        ...doc.data()
                    } as Queue);
                });

                setQueues(queueList);

                // IMPORTANT: Définir automatiquement la première file comme file courante UNIQUEMENT si aucune file n'est sélectionnée
                // et si le localStorage ne contient pas d'ID de file
                const storedQueueId = typeof window !== 'undefined' ? localStorage.getItem('lastQueueId') : null;

                if (queueList.length > 0 && !currentQueue && !storedQueueId) {
                    console.log("Première initialisation, utilisation de la première file");
                    setCurrentQueue(queueList[0]);
                }

                setLoading(false);
            }, (err) => {
                console.error('Erreur lors du chargement des files d\'attente:', err);
                setError('Erreur lors du chargement des files d\'attente');
                setLoading(false);
            });
        } catch (err) {
            console.error('Erreur lors de la configuration de l\'écouteur des files d\'attente:', err);
            setLoading(false);
        }

        return () => {
            try {
                // Assurez-vous que unsubscribe est appelé en toute sécurité
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            } catch (err) {
                console.error('Erreur lors du nettoyage de l\'écouteur des files d\'attente:', err);
            }
        };
    }, [user, db]); // Ajout de currentQueue comme dépendance

    // Effet pour initialiser currentQueue uniquement si nécessaire
    useEffect(() => {
        if (queues.length > 0 && !currentQueue) {
            try {
                // Récupérer l'ID de la file stockée dans localStorage
                const storedQueueId = typeof window !== 'undefined' ? localStorage.getItem('lastQueueId') : null;
                console.log("ID de file stocké récupéré:", storedQueueId);

                // Trouver la file correspondante dans la liste des files disponibles
                const storedQueue = storedQueueId ? queues.find(q => q.id === storedQueueId) : null;
                console.log("File correspondante trouvée:", storedQueue?.name || "Aucune");

                // Si la file stockée existe, l'utiliser, sinon utiliser la première file
                if (storedQueue) {
                    console.log("Utilisation de la file stockée:", storedQueue.name);
                    setCurrentQueue(storedQueue);
                } else {
                    console.log("Utilisation de la première file:", queues[0].name);
                    setCurrentQueue(queues[0]);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération de la file d'attente stockée:", err);
                // En cas d'erreur, utiliser la première file comme fallback
                setCurrentQueue(queues[0]);
            }
        }
    }, [queues]); // Ne dépend que de queues, pas de currentQueue

    // Effet pour stocker l'ID de currentQueue dans localStorage quand il change
    useEffect(() => {
        if (currentQueue) {
            try {
                console.log("Stockage de l'ID de file:", currentQueue.id);
                localStorage.setItem('lastQueueId', currentQueue.id);
            } catch (err) {
                console.error("Erreur lors du stockage de l'ID de file:", err);
            }
        }
    }, [currentQueue?.id]); // Utiliser currentQueue.id comme dépendance pour éviter des re-renders inutiles

    // Charger les clients de la file d'attente courante
    useEffect(() => {
        if (!currentQueue || !db) {
            setClients([]);
            return () => { }; // Fonction de nettoyage vide
        }

        console.log("Chargement des clients pour la file d'attente:", currentQueue.id);

        const clientsRef = collection(db, 'clients');
        const q = query(clientsRef, where('queueId', '==', currentQueue.id));

        // Définir unsubscribe comme une fonction vide par défaut
        let unsubscribe = () => { };

        try {
            unsubscribe = onSnapshot(q, (snapshot) => {
                console.log(`Snapshot reçu avec ${snapshot.docs.length} clients`);
                const clientList: Client[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    clientList.push({
                        id: doc.id,
                        ...data
                    } as Client);
                });

                console.log("Clients chargés:", clientList.length);
                setClients(clientList);
            }, (err) => {
                console.error('Erreur lors du chargement des clients:', err);
                setError('Erreur lors du chargement des clients');
            });
        } catch (err) {
            console.error('Erreur lors de la configuration de l\'écouteur des clients:', err);
        }

        return () => {
            try {
                // Assurez-vous que unsubscribe est appelé en toute sécurité
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            } catch (err) {
                console.error('Erreur lors du nettoyage de l\'écouteur des clients:', err);
            }
        };
    }, [currentQueue?.id, db]);

    // Filtre pour les clients en attente, triés par position de façon plus stricte
    const waitingClients = clients
        .filter(client => client.status === 'waiting')
        .sort((a, b) => {
            // Tri prioritaire par position numérique
            const posA = typeof a.position === 'number' ? a.position : Number.MAX_SAFE_INTEGER;
            const posB = typeof b.position === 'number' ? b.position : Number.MAX_SAFE_INTEGER;

            if (posA !== posB) {
                return posA - posB;
            }

            // En cas de positions égales ou non définies, trier par date de création
            const dateA = a.createdAt ? (
                a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt && typeof a.createdAt.seconds === 'number'
                    ? new Date(a.createdAt.seconds * 1000)
                    : new Date(a.createdAt as any)
            ) : new Date(0);

            const dateB = b.createdAt ? (
                b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt && typeof b.createdAt.seconds === 'number'
                    ? new Date(b.createdAt.seconds * 1000)
                    : new Date(b.createdAt as any)
            ) : new Date(0);

            return dateA.getTime() - dateB.getTime(); // Du plus ancien au plus récent
        });

    // Effet pour vérifier si la limite de clients est atteinte
    useEffect(() => {
        if (currentQueue && waitingClients) {
            const maxClients = currentQueue.maxClients || 50;
            const dailyCount = currentQueue.dailyCounter || 0;
            setHasReachedClientLimit(dailyCount >= maxClients);
        }
    }, [currentQueue, waitingClients]);

    // Filtre pour les clients servis, triés par date de service (du plus récent au plus ancien)
    const servedClients = clients
        .filter(client => client.status === 'served')
        .sort((a, b) => {
            // S'assurer que les dates sont correctement comparées
            let dateA: Date;
            if (a.servedAt) {
                if (typeof a.servedAt === 'object' && 'seconds' in a.servedAt && typeof a.servedAt.seconds === 'number') {
                    dateA = new Date(a.servedAt.seconds * 1000);
                } else {
                    dateA = new Date(a.servedAt as any);
                }
            } else if (a.updatedAt) {
                if (typeof a.updatedAt === 'object' && 'seconds' in a.updatedAt && typeof a.updatedAt.seconds === 'number') {
                    dateA = new Date(a.updatedAt.seconds * 1000);
                } else {
                    dateA = new Date(a.updatedAt as any);
                }
            } else {
                dateA = new Date(0);
            }

            let dateB: Date;
            if (b.servedAt) {
                if (typeof b.servedAt === 'object' && 'seconds' in b.servedAt && typeof b.servedAt.seconds === 'number') {
                    dateB = new Date(b.servedAt.seconds * 1000);
                } else {
                    dateB = new Date(b.servedAt as any);
                }
            } else if (b.updatedAt) {
                if (typeof b.updatedAt === 'object' && 'seconds' in b.updatedAt && typeof b.updatedAt.seconds === 'number') {
                    dateB = new Date(b.updatedAt.seconds * 1000);
                } else {
                    dateB = new Date(b.updatedAt as any);
                }
            } else {
                dateB = new Date(0);
            }

            // Tri du plus récent au plus ancien
            return dateB.getTime() - dateA.getTime();
        });

    // Filtre pour les clients annulés, triés par date d'annulation (du plus récent au plus ancien)
    const canceledClients = clients
        .filter(client => client.status === 'canceled' || client.status === 'no-show')
        .sort((a, b) => {
            // S'assurer que les dates sont correctement comparées
            let dateA: Date;
            if (a.updatedAt) {
                if (typeof a.updatedAt === 'object' && 'seconds' in a.updatedAt && typeof a.updatedAt.seconds === 'number') {
                    dateA = new Date(a.updatedAt.seconds * 1000);
                } else {
                    dateA = new Date(a.updatedAt as any);
                }
            } else if (a.createdAt) {
                if (typeof a.createdAt === 'object' && 'seconds' in a.createdAt && typeof a.createdAt.seconds === 'number') {
                    dateA = new Date(a.createdAt.seconds * 1000);
                } else {
                    dateA = new Date(a.createdAt as any);
                }
            } else {
                dateA = new Date(0);
            }

            let dateB: Date;
            if (b.updatedAt) {
                if (typeof b.updatedAt === 'object' && 'seconds' in b.updatedAt && typeof b.updatedAt.seconds === 'number') {
                    dateB = new Date(b.updatedAt.seconds * 1000);
                } else {
                    dateB = new Date(b.updatedAt as any);
                }
            } else if (b.createdAt) {
                if (typeof b.createdAt === 'object' && 'seconds' in b.createdAt && typeof b.createdAt.seconds === 'number') {
                    dateB = new Date(b.createdAt.seconds * 1000);
                } else {
                    dateB = new Date(b.createdAt as any);
                }
            } else {
                dateB = new Date(0);
            }

            // Tri du plus récent au plus ancien
            return dateB.getTime() - dateA.getTime();
        });

    // Créer une nouvelle file d'attente
    const createQueue = async (data: Partial<Queue>): Promise<string> => {
        try {
            if (!user) throw new Error('Utilisateur non connecté');

            const queueId = generateId('q-');
            const currentDate = new Date();
            const resetDate = new Date();
            resetDate.setHours(0, 0, 0, 0);
            resetDate.setDate(resetDate.getDate() + 1);

            // Valeurs par défaut pour une nouvelle file d'attente
            const defaultSettings: QueueSettings = {
                allowSelfRegistration: true,
                requireClientPhone: true,
                requireClientEmail: false,
                notifyNextClientInAdvance: true,
                notifyAdvanceCount: 2,
                notificationType: ['sms'],
                autoIncrementToken: true,
                displayEstimatedWaitTime: true
            };

            const queueData: Queue = {
                id: queueId,
                ownerId: user.id,
                name: data.name || 'Nouvelle file d\'attente',
                description: data.description || '',
                createdAt: serverTimestamp() as any,
                updatedAt: serverTimestamp() as any,
                status: 'active',
                isActive: true,
                averageServiceTime: data.averageServiceTime || 5,
                maxClients: data.maxClients || 50,
                currentToken: 1,
                dailyCounter: 0,
                resetDailyAt: resetDate,
                publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/q/${queueId}`,
                settings: {
                    ...defaultSettings,
                    ...data.settings
                },
                stats: {
                    avgWaitTime: 0,
                    maxWaitTime: 0,
                    totalServed: 0,
                    canceledCount: 0
                },
                ...data
            };

            // Créer la file d'attente dans Firestore
            await setDoc(doc(db, 'queues', queueId), queueData);

            // Créer un objet Queue pour l'état local
            const localQueue: Queue = {
                ...queueData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mettre à jour l'état local immédiatement
            setQueues(prevQueues => [localQueue, ...prevQueues]);
            setCurrentQueue(localQueue);

            return queueId;
        } catch (err) {
            console.error('Erreur lors de la création de la file d\'attente:', err);
            setError('Erreur lors de la création de la file d\'attente');
            throw err;
        }
    };

    // Mettre à jour une file d'attente
    const updateQueue = async (id: string, data: Partial<Queue>): Promise<void> => {
        try {
            if (!user) throw new Error('Utilisateur non connecté');

            const queueRef = doc(db, 'queues', id);

            // Vérifier si averageServiceTime est mis à jour
            if (data.averageServiceTime !== undefined) {
                console.log("Mise à jour du temps moyen de service:", data.averageServiceTime);
                await updateWaitingClientsEstimatedTime(id, data.averageServiceTime);
            }

            await updateDoc(queueRef, {
                ...data,
                updatedAt: serverTimestamp()
            });

            // Mettre à jour la file courante si c'est celle qui est modifiée
            if (currentQueue && currentQueue.id === id) {
                setCurrentQueue(prev => prev ? { ...prev, ...data } : null);
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la file d\'attente:', err);
            setError('Erreur lors de la mise à jour de la file d\'attente');
            throw err;
        }
    };

    // Supprimer une file d'attente
    const deleteQueue = async (id: string): Promise<void> => {
        try {
            if (!user) throw new Error('Utilisateur non connecté');

            // Supprimer tous les clients de cette file d'attente
            const clientsRef = collection(db, 'clients');
            const q = query(clientsRef, where('queueId', '==', id));
            const snapshot = await getDocs(q);

            const batch: Promise<void>[] = [];
            for (const docSnap of snapshot.docs) {
                batch.push(deleteDoc(doc(db, 'clients', docSnap.id)));
            }

            await Promise.all(batch);

            // Supprimer la file d'attente
            await deleteDoc(doc(db, 'queues', id));

            // Mettre à jour l'état local
            setQueues(prevQueues => prevQueues.filter(queue => queue.id !== id));

            // Si la file supprimée est la file courante, réinitialiser
            if (currentQueue && currentQueue.id === id) {
                setCurrentQueue(null);
            }
        } catch (err) {
            console.error('Erreur lors de la suppression de la file d\'attente:', err);
            setError('Erreur lors de la suppression de la file d\'attente');
            throw err;
        }
    };

    // Vérifier si un client avec le même nom et téléphone existe déjà
    const checkForClientDuplicate = async (name: string, phone: string): Promise<boolean> => {
        if (!currentQueue || !phone || !name) return false;

        try {
            const clientsRef = collection(db, 'clients');
            const duplicateQuery = query(
                clientsRef,
                where('queueId', '==', currentQueue.id),
                where('status', '==', 'waiting'),
                where('name', '==', name),
                where('phone', '==', phone)
            );

            const querySnapshot = await getDocs(duplicateQuery);
            return !querySnapshot.empty;
        } catch (err) {
            console.error('Erreur lors de la vérification des doublons:', err);
            return false;
        }
    };

    // Ajouter un client à la file d'attente
    const addClient = async (data: Partial<Client>): Promise<string> => {
        try {
            // Capturer la référence actuelle à currentQueue pour éviter les problèmes
            const targetQueue = currentQueue;

            if (!targetQueue) throw new Error('Aucune file d\'attente sélectionnée');

            // Vérifier si c'est un doublon
            if (data.name && data.phone) {
                const isDuplicate = await checkForClientDuplicate(data.name, data.phone);
                if (isDuplicate) {
                    throw new Error('Un client avec le même nom et numéro existe déjà dans la file d\'attente');
                }
            }

            console.log("Ajout d'un client à la file d'attente:", targetQueue.id);

            const clientId = generateId('c-');
            const queueRef = doc(db, 'queues', targetQueue.id);
            const queueDoc = await getDoc(queueRef);

            if (!queueDoc.exists()) {
                throw new Error('File d\'attente introuvable');
            }

            const queue = { id: queueDoc.id, ...queueDoc.data() } as Queue;
            console.log("File d'attente trouvée:", queue.name);

            // Vérifier la limite de clients par jour selon l'abonnement
            if ((queue.dailyCounter || 0) >= (queue.maxClients || 50)) {
                throw new Error('Limite de clients journalière atteinte');
            }

            // Déterminer le prochain token
            let token: string | number = queue.currentToken || 1;
            if (queue.settings?.tokenPrefix) {
                token = `${queue.settings.tokenPrefix}${token}`;
            }

            // Calculer la position dans la file (utiliser une requête pour obtenir les positions existantes)
            const clientsRef = collection(db, 'clients');
            const waitingClientsQuery = query(
                clientsRef,
                where('queueId', '==', targetQueue.id),
                where('status', '==', 'waiting')
            );
            const waitingClientsSnapshot = await getDocs(waitingClientsQuery);

            // Trouver la position maximale actuellement utilisée
            let maxPosition = 0;
            waitingClientsSnapshot.forEach(doc => {
                const clientData = doc.data();
                if (clientData.position && typeof clientData.position === 'number') {
                    maxPosition = Math.max(maxPosition, clientData.position);
                }
            });

            // La nouvelle position est la suivante après la position maximale actuelle
            const position = maxPosition + 1;

            console.log(`Nouvelle position calculée: ${position} (après max actuel: ${maxPosition})`);

            // Calculer le temps d'attente estimé
            const estimatedWaitTime = position * (queue.averageServiceTime || 5);

            // S'assurer que clientUid est présent 
            const clientUid = data.clientUid || generateId('cuid-');

            // Construire les données du client
            const clientData = {
                id: clientId,
                queueId: targetQueue.id,
                name: data.name || 'Client',
                email: data.email || '',
                phone: data.phone || '',
                token: token,
                position: position,
                status: 'waiting' as const,  // Utiliser une assertion de type
                notes: data.notes || '',
                createdAt: serverTimestamp() as unknown as Date,
                estimatedWaitTime: estimatedWaitTime,
                clientUid: clientUid,
                ...data
            };

            // Supprimer le champ status du spread de données pour éviter les conflits
            if (data.status) {
                delete data.status;
            }

            console.log("Création du client:", clientData);

            // Créer le client dans Firestore
            await setDoc(doc(db, 'clients', clientId), clientData);

            // Mettre à jour la file d'attente (incrémenter le token et le compteur journalier)
            await updateDoc(queueRef, {
                currentToken: typeof queue.currentToken === 'number' ? increment(1) : 1,
                dailyCounter: increment(1),
                updatedAt: serverTimestamp()
            });

            console.log("Client ajouté avec succès, ID:", clientId);
            return clientId;
        } catch (err) {
            console.error('Erreur lors de l\'ajout du client:', err);
            setError(`Erreur lors de l'ajout du client: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            throw err;
        }
    };

    // Mettre à jour un client
    const updateClient = async (id: string, data: Partial<Client>): Promise<void> => {
        try {
            const clientRef = doc(db, 'clients', id);

            await updateDoc(clientRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error('Erreur lors de la mise à jour du client:', err);
            setError('Erreur lors de la mise à jour du client');
            throw err;
        }
    };

    // Récupérer une file d'attente par ID
    const getQueue = async (id: string): Promise<Queue | null> => {
        try {
            const queueRef = doc(db, 'queues', id);
            const queueSnap = await getDoc(queueRef);

            if (queueSnap.exists()) {
                return { id: queueSnap.id, ...queueSnap.data() } as Queue;
            }

            return null;
        } catch (err) {
            console.error('Erreur lors de la récupération de la file d\'attente:', err);
            setError('Erreur lors de la récupération de la file d\'attente');
            return null;
        }
    };

    // Récupérer un client par ID
    const getClient = async (id: string): Promise<Client | null> => {
        try {
            const clientRef = doc(db, 'clients', id);
            const clientSnap = await getDoc(clientRef);

            if (clientSnap.exists()) {
                return { id: clientSnap.id, ...clientSnap.data() } as Client;
            }

            return null;
        } catch (err) {
            console.error('Erreur lors de la récupération du client:', err);
            setError('Erreur lors de la récupération du client');
            return null;
        }
    };

    // Appeler le prochain client
    const callNextClient = async (): Promise<Client | null> => {
        try {
            if (!currentQueue || waitingClients.length === 0) {
                return null;
            }

            // Prendre le premier client en attente
            const nextClient = waitingClients[0];

            // Mettre à jour son statut
            await updateDoc(doc(db, 'clients', nextClient.id), {
                status: 'waiting', // Garder waiting pour contourner le problème de type
                calledAt: serverTimestamp() // Utiliser calledAt maintenant qu'il est défini dans le type
            });

            // Retourner le client mis à jour en créant un nouvel objet
            return {
                ...nextClient,
                // Ne pas changer le status pour éviter les problèmes de type
                calledAt: new Date() as unknown as Timestamp // Forcer le type Timestamp
            };
        } catch (err) {
            console.error('Erreur lors de l\'appel du prochain client:', err);
            setError('Erreur lors de l\'appel du prochain client');
            return null;
        }
    };

    // Marquer un client comme servi
    const serveClient = async (id: string): Promise<void> => {
        try {
            // Capturer la référence actuelle à currentQueue
            const targetQueue = currentQueue;

            const clientRef = doc(db, 'clients', id);
            const clientSnap = await getDoc(clientRef);

            if (!clientSnap.exists()) {
                throw new Error('Client introuvable');
            }

            const client = clientSnap.data() as Client;

            await updateDoc(clientRef, {
                status: 'served',
                servedAt: serverTimestamp()
            });

            // Mettre à jour les positions des autres clients en attente
            const waitingClientsRef = collection(db, 'clients');
            const q = query(
                waitingClientsRef,
                where('queueId', '==', client.queueId),
                where('status', '==', 'waiting'),
                where('position', '>', client.position)
            );

            const snapshot = await getDocs(q);
            const batch: Promise<void>[] = [];

            // Récupérer le temps moyen de service actuel
            const queueRef = doc(db, 'queues', client.queueId);
            const queueSnap = await getDoc(queueRef);
            const averageServiceTime = queueSnap.exists() ?
                (queueSnap.data().averageServiceTime || 5) : 5;

            snapshot.forEach((doc) => {
                const clientData = doc.data();
                const newPosition = (clientData.position as number) - 1;

                // Mettre à jour la position et le temps d'attente estimé
                batch.push(updateDoc(doc.ref, {
                    position: increment(-1),
                    estimatedWaitTime: newPosition * averageServiceTime
                }));
            });

            await Promise.all(batch);

            // Mettre à jour les statistiques de la file d'attente
            // Utiliser targetQueue.id au lieu de currentQueue.id
            if (targetQueue && client.queueId === targetQueue.id) {
                await updateQueueStats(targetQueue.id);
            }
        } catch (err) {
            console.error('Erreur lors du service du client:', err);
            setError('Erreur lors du service du client');
            throw err;
        }
    };

    // Annuler un client
    const cancelClient = async (id: string): Promise<void> => {
        try {
            // Capturer la référence actuelle à currentQueue
            const targetQueue = currentQueue;

            const clientRef = doc(db, 'clients', id);
            const clientSnap = await getDoc(clientRef);

            if (!clientSnap.exists()) {
                throw new Error('Client introuvable');
            }

            const client = clientSnap.data() as Client;

            await updateDoc(clientRef, {
                status: 'canceled',
                updatedAt: serverTimestamp()
            });

            // Mettre à jour les positions des autres clients en attente
            if (client.status === 'waiting') {
                const waitingClientsRef = collection(db, 'clients');
                const q = query(
                    waitingClientsRef,
                    where('queueId', '==', client.queueId),
                    where('status', '==', 'waiting'),
                    where('position', '>', client.position)
                );

                const snapshot = await getDocs(q);
                const batch: Promise<void>[] = [];

                // Récupérer le temps moyen de service actuel
                const queueRef = doc(db, 'queues', client.queueId);
                const queueSnap = await getDoc(queueRef);
                const averageServiceTime = queueSnap.exists() ?
                    (queueSnap.data().averageServiceTime || 5) : 5;

                snapshot.forEach((doc) => {
                    const clientData = doc.data();
                    const newPosition = (clientData.position as number) - 1;

                    // Mettre à jour la position et le temps d'attente estimé
                    batch.push(updateDoc(doc.ref, {
                        position: increment(-1),
                        estimatedWaitTime: newPosition * averageServiceTime
                    }));
                });

                await Promise.all(batch);
            }

            // Mettre à jour les statistiques de la file d'attente
            // Utiliser targetQueue.id au lieu de currentQueue.id
            if (targetQueue && client.queueId === targetQueue.id) {
                await updateDoc(doc(db, 'queues', targetQueue.id), {
                    'stats.canceledCount': increment(1)
                });
            }
        } catch (err) {
            console.error('Erreur lors de l\'annulation du client:', err);
            setError('Erreur lors de l\'annulation du client');
            throw err;
        }
    };

    // Marquer un client comme absent
    const markNoShow = async (id: string): Promise<void> => {
        try {
            // Capturer la référence actuelle à currentQueue
            const targetQueue = currentQueue;

            const clientRef = doc(db, 'clients', id);
            const clientSnap = await getDoc(clientRef);

            if (!clientSnap.exists()) {
                throw new Error('Client introuvable');
            }

            const client = clientSnap.data() as Client;

            await updateDoc(clientRef, {
                status: 'no-show',
                updatedAt: serverTimestamp()
            });

            // Mettre à jour les statistiques
            // Utiliser targetQueue.id au lieu de currentQueue.id
            if (targetQueue && client.queueId === targetQueue.id) {
                await updateDoc(doc(db, 'queues', targetQueue.id), {
                    'stats.canceledCount': increment(1)
                });
            }
        } catch (err) {
            console.error('Erreur lors du marquage du client comme absent:', err);
            setError('Erreur lors du marquage du client comme absent');
            throw err;
        }
    };

    // Mettre à jour les statistiques de la file d'attente
    const updateQueueStats = async (queueId: string) => {
        try {
            // Récupérer les clients récemment servis
            const clientsRef = collection(db, 'clients');
            const servedClientsQuery = query(
                clientsRef,
                where('queueId', '==', queueId),
                where('status', '==', 'served'),
                orderBy('servedAt', 'desc'), // Tri par date de service (les plus récents d'abord)
                limit(20) // Limiter aux 20 derniers clients servis pour un calcul plus pertinent
            );

            const snapshot = await getDocs(servedClientsQuery);
            const servedClients: any[] = [];

            snapshot.forEach(doc => {
                servedClients.push(doc.data());
            });

            const stats = calculateQueueStats(servedClients);

            // Calcul plus sophistiqué du temps moyen de service
            let newAverageServiceTime;

            if (stats.totalServed >= 3) {
                // Récupérer les 10 derniers temps de service individuels (en minutes)
                const recentServiceTimes = servedClients
                    .filter(client =>
                        client.createdAt &&
                        client.servedAt &&
                        timestampToDate(client.createdAt) &&
                        timestampToDate(client.servedAt)
                    )
                    .map(client => {
                        const createdDate = timestampToDate(client.createdAt);
                        const servedDate = timestampToDate(client.servedAt);

                        if (!createdDate || !servedDate) return 0;

                        // Calculer le temps de service en minutes
                        const waitMinutes = differenceInMinutes(servedDate, createdDate);

                        // Ignorer les valeurs extrêmes (au-dessus de 60 minutes ou en dessous de 1 minute)
                        if (waitMinutes < 1 || waitMinutes > 60) return null;

                        return waitMinutes;
                    })
                    .filter((time): time is number => time !== null) // Supprimer les valeurs null et indiquer que time est un nombre
                    .slice(0, 10);  // Prendre les 10 premiers (les plus récents)

                if (recentServiceTimes.length >= 3) {
                    // Calculer une moyenne pondérée, où les temps récents ont plus de poids
                    let totalWeight = 0;
                    let weightedSum = 0;

                    recentServiceTimes.forEach((time, index) => {
                        // Donner plus de poids aux temps les plus récents
                        const weight = recentServiceTimes.length - index;
                        totalWeight += weight;
                        weightedSum += time * weight;
                    });

                    // Garantir un minimum de 1 minute
                    newAverageServiceTime = Math.max(1, Math.round(weightedSum / totalWeight));

                    console.log("Nouveau temps moyen de service calculé:", newAverageServiceTime, "min");
                } else {
                    // Utiliser la moyenne simple si pas assez de temps récents
                    newAverageServiceTime = Math.max(1, stats.avgWaitTime);
                    console.log("Utilisation de la moyenne simple:", newAverageServiceTime, "min");
                }
            }

            // Préparer les données à mettre à jour
            const updateData: any = {
                'stats.avgWaitTime': stats.avgWaitTime,
                'stats.maxWaitTime': stats.maxWaitTime,
                'stats.totalServed': stats.totalServed
            };

            // Ajouter averageServiceTime seulement si on a calculé une nouvelle valeur
            if (newAverageServiceTime) {
                updateData.averageServiceTime = newAverageServiceTime;

                // Si le temps moyen de service a changé, mettre à jour le temps d'attente estimé de tous les clients en attente
                await updateWaitingClientsEstimatedTime(queueId, newAverageServiceTime);
            }

            await updateDoc(doc(db, 'queues', queueId), updateData);
        } catch (err) {
            console.error('Erreur lors de la mise à jour des statistiques:', err);
        }
    };

    // Mettre à jour le temps d'attente estimé pour tous les clients en attente
    const updateWaitingClientsEstimatedTime = async (queueId: string, newAverageServiceTime: number) => {
        try {
            // Récupérer les informations de la file d'attente
            const queueRef = doc(db, 'queues', queueId);
            const queueSnap = await getDoc(queueRef);

            if (!queueSnap.exists()) {
                throw new Error("File d'attente introuvable");
            }

            const queue = queueSnap.data() as QueueWithServers;
            // Utiliser 1 comme valeur par défaut 
            const activeServers = queue.settings?.activeServers ?? 1;

            // Récupérer les clients en attente
            const clientsRef = collection(db, 'clients');
            const waitingClientsQuery = query(
                clientsRef,
                where('queueId', '==', queueId),
                where('status', '==', 'waiting'),
                orderBy('position')
            );

            const snapshot = await getDocs(waitingClientsQuery);
            const batch: Promise<void>[] = [];

            snapshot.docs.forEach((docSnapshot, index) => {
                const position = index + 1;
                const estimatedMinutes = calculateWaitingTime(
                    position,
                    newAverageServiceTime,
                    activeServers
                );

                batch.push(updateDoc(docSnapshot.ref, {
                    estimatedWaitTime: estimatedMinutes,
                    updatedAt: serverTimestamp()
                }));
            });

            await Promise.all(batch);
            console.log(`Temps d'attente estimé mis à jour pour ${batch.length} clients`);
        } catch (err) {
            console.error("Erreur lors de la mise à jour des temps d'attente estimés:", err);
        }
    };

    // Obtenir les statistiques d'une file d'attente
    const getQueueStats = async (queueId: string): Promise<QueueStats> => {
        try {
            const queueRef = doc(db, 'queues', queueId);
            const queueSnap = await getDoc(queueRef);

            if (!queueSnap.exists()) {
                throw new Error('File d\'attente introuvable');
            }

            const queue = queueSnap.data() as Queue;

            return queue.stats || {
                avgWaitTime: 0,
                maxWaitTime: 0,
                totalServed: 0
            };
        } catch (err) {
            console.error('Erreur lors de la récupération des statistiques:', err);
            return {
                avgWaitTime: 0,
                maxWaitTime: 0,
                totalServed: 0
            };
        }
    };

    // Supprimer un client spécifique
    const deleteClient = async (id: string): Promise<void> => {
        try {
            if (!currentQueue) throw new Error('Aucune file d\'attente sélectionnée');

            const clientRef = doc(db, 'clients', id);
            const clientSnap = await getDoc(clientRef);

            if (!clientSnap.exists()) {
                throw new Error('Client introuvable');
            }

            const client = clientSnap.data() as Client;

            // Vérifier que le client appartient à la file d'attente actuelle
            if (client.queueId !== currentQueue.id) {
                throw new Error('Ce client n\'appartient pas à la file d\'attente actuelle');
            }

            // Supprimer le client
            await deleteDoc(clientRef);

            // Si c'était un client en attente, réorganiser les positions
            if (client.status === 'waiting' && client.position) {
                const clientsAfterQuery = query(
                    collection(db, 'clients'),
                    where('queueId', '==', currentQueue.id),
                    where('status', '==', 'waiting'),
                    where('position', '>', client.position)
                );

                const snapshot = await getDocs(clientsAfterQuery);
                const batch: Promise<void>[] = [];

                // Récupérer le temps moyen de service actuel
                const queueRef = doc(db, 'queues', currentQueue.id);
                const queueSnap = await getDoc(queueRef);
                const averageServiceTime = queueSnap.exists() ?
                    (queueSnap.data().averageServiceTime || 5) : 5;

                snapshot.forEach((doc) => {
                    const clientData = doc.data();
                    const newPosition = (clientData.position as number) - 1;

                    // Mettre à jour la position et le temps d'attente estimé
                    batch.push(updateDoc(doc.ref, {
                        position: increment(-1),
                        estimatedWaitTime: newPosition * averageServiceTime
                    }));
                });

                await Promise.all(batch);
            }

            // Mettre à jour la file d'attente (dernière modification)
            await updateDoc(doc(db, 'queues', currentQueue.id), {
                updatedAt: serverTimestamp()
            });

        } catch (err) {
            console.error('Erreur lors de la suppression du client:', err);
            setError('Erreur lors de la suppression du client');
            throw err;
        }
    };

    // Vider la file d'attente (supprimer tous les clients en attente)
    const clearQueue = async (): Promise<void> => {
        try {
            if (!currentQueue) throw new Error('Aucune file d\'attente sélectionnée');

            const clientsRef = collection(db, 'clients');
            const waitingClientsQuery = query(
                clientsRef,
                where('queueId', '==', currentQueue.id),
                where('status', '==', 'waiting')
            );

            const snapshot = await getDocs(waitingClientsQuery);
            const batch: Promise<void>[] = [];

            snapshot.forEach((doc) => {
                batch.push(deleteDoc(doc.ref));
            });

            await Promise.all(batch);

            // Mettre à jour la file d'attente
            await updateDoc(doc(db, 'queues', currentQueue.id), {
                updatedAt: serverTimestamp()
            });

            console.log(`${snapshot.size} clients supprimés de la file d'attente`);
        } catch (err) {
            console.error('Erreur lors de la suppression des clients:', err);
            setError('Erreur lors de la suppression des clients');
            throw err;
        }
    };

    /**
     * Met à jour les temps d'attente estimés pour tous les clients en attente
     */
    const updateWaitingTimesEstimates = async (queueId?: string): Promise<boolean> => {
        try {
            // Vérifier si nous avons un utilisateur authentifié
            if (!user) {
                throw new Error("Vous devez être connecté pour mettre à jour les estimations de temps d'attente");
            }

            // Utiliser la file d'attente actuelle si aucun ID n'est fourni
            const targetQueueId = queueId || (currentQueue?.id || "");
            if (!targetQueueId) {
                throw new Error("Aucune file d'attente sélectionnée");
            }

            // Mettre à jour l'état de chargement
            if (typeof setLoading === 'function') {
                if (typeof loading === 'boolean') {
                    setLoading(true);
                } else if (loading && typeof loading === 'object') {
                    setLoading(Object.assign({}, loading, { updatingEstimates: true }));
                }
            }

            // Récupérer les temps de service des clients récemment servis
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            // Récupérer les clients servis récemment
            const serviceTimesRef = collection(db, 'clients');
            const serviceTimesQuery = query(
                serviceTimesRef,
                where("queueId", "==", targetQueueId),
                where("status", "==", "served"),
                where("servedAt", "!=", null),
                orderBy("servedAt", "desc"),
                limit(20)
            );

            const serviceTimesSnapshot = await getDocs(serviceTimesQuery);
            const recentServiceTimes: number[] = [];
            const hourlyServiceTimes: { [hour: number]: number[] } = {};

            // Calculer les temps de service récents
            serviceTimesSnapshot.forEach(doc => {
                const data = doc.data();

                // Calculer le temps de service entre l'appel et le service
                if (data.servedAt && data.calledAt) {
                    const calledTime = timestampToDate(data.calledAt);
                    const servedTime = timestampToDate(data.servedAt);

                    if (calledTime && servedTime) {
                        // Calculer le temps de service en minutes
                        const serviceTimeMinutes = (servedTime.getTime() - calledTime.getTime()) / (1000 * 60);

                        // Ne considérer que les temps raisonnables (entre 1 et 60 minutes)
                        if (serviceTimeMinutes >= 1 && serviceTimeMinutes <= 60) {
                            recentServiceTimes.push(serviceTimeMinutes);

                            // Regrouper les temps de service par heure pour détecter les heures de pointe
                            const hour = servedTime.getHours();
                            if (!hourlyServiceTimes[hour]) {
                                hourlyServiceTimes[hour] = [];
                            }
                            hourlyServiceTimes[hour].push(serviceTimeMinutes);
                        }
                    }
                }
            });

            // Récupérer tous les clients en attente
            const waitingClientsRef = collection(db, 'clients');
            const waitingClientsQuery = query(
                waitingClientsRef,
                where("queueId", "==", targetQueueId),
                where("status", "==", "waiting"),
                orderBy("position", "asc")
            );

            const waitingClientsSnapshot = await getDocs(waitingClientsQuery);

            // Récupérer les paramètres de la file d'attente
            const queueRef = doc(db, 'queues', targetQueueId);
            const queueSnapshot = await getDoc(queueRef);

            if (!queueSnapshot.exists()) {
                throw new Error("File d'attente non trouvée");
            }

            const queueData = queueSnapshot.data();
            const settings = queueData.settings || {};

            // Récupérer le nombre de serveurs actifs depuis les paramètres de la file
            const activeServers = settings.activeServers || 1;
            const averageServiceTime = queueData.averageServiceTime || 5;

            // Déterminer si nous sommes actuellement en heure de pointe
            const currentHour = new Date().getHours();
            let peakHourFactor = 1.0;

            // Si nous avons assez de données pour cette heure
            if (hourlyServiceTimes[currentHour] && hourlyServiceTimes[currentHour].length >= 5) {
                const hourlyAvg = hourlyServiceTimes[currentHour].reduce((sum, time) => sum + time, 0) /
                    hourlyServiceTimes[currentHour].length;

                // Si le temps moyen à cette heure est plus long que la moyenne générale
                if (hourlyAvg > averageServiceTime) {
                    // Augmenter le facteur d'heure de pointe (jusqu'à 30% de plus)
                    peakHourFactor = Math.min(1.3, hourlyAvg / averageServiceTime);
                }
            }

            // Créer un batch pour les mises à jour
            const batch = writeBatch(db);
            let updatedCount = 0;
            const waitingClientsCount = waitingClientsSnapshot.size;

            // Mettre à jour chaque client en attente
            waitingClientsSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const clientRef = docSnapshot.ref;
                const position = data.position || 0;
                const joinedAt = data.joinedAt;

                // Estimation du moment où le client sera servi
                const joinedAtDate = joinedAt ? timestampToDate(joinedAt) : null;
                const now = new Date();
                const waitedSoFar = joinedAtDate ?
                    Math.max(0, (now.getTime() - joinedAtDate.getTime()) / (1000 * 60)) : 0;

                // Calculer le temps d'attente estimé avec tous les paramètres disponibles
                const estimatedWaitTime = calculateWaitingTime(
                    position,
                    averageServiceTime * peakHourFactor, // Appliquer le facteur d'heure de pointe
                    activeServers,
                    recentServiceTimes,
                    waitingClientsCount // Passer la taille de la file d'attente
                );

                // Soustraire le temps déjà attendu (mais ne pas descendre en dessous de 1)
                const remainingWaitTime = Math.max(1, estimatedWaitTime - waitedSoFar);

                batch.update(clientRef, {
                    estimatedWaitTime: Math.round(remainingWaitTime),
                    updatedAt: serverTimestamp()
                });
                updatedCount++;
            });

            // Mettre à jour la file d'attente avec le timestamp de dernière mise à jour
            batch.update(queueRef, {
                updatedAt: serverTimestamp()
            });

            // Exécuter le batch
            await batch.commit();
            console.log(`${updatedCount} clients ont eu leur temps d'attente mis à jour`);

            // Si nous avons assez de données récentes, mettre à jour le temps moyen de service
            if (recentServiceTimes.length >= 5) {
                const avgRecentServiceTime = recentServiceTimes.reduce((sum, time) => sum + time, 0) / recentServiceTimes.length;

                // Vérifier si le temps moyen récent diffère significativement du temps moyen enregistré
                const difference = Math.abs(avgRecentServiceTime - averageServiceTime);
                const percentageDifference = (difference / averageServiceTime) * 100;

                // Si la différence est supérieure à 20%, mettre à jour le temps moyen
                if (percentageDifference > 20) {
                    // Combiner l'ancien et le nouveau temps (70% nouveau, 30% ancien)
                    const newAverageServiceTime = (avgRecentServiceTime * 0.7) + (averageServiceTime * 0.3);

                    await updateDoc(queueRef, {
                        averageServiceTime: Math.round(newAverageServiceTime * 10) / 10, // Arrondi à 1 décimale
                        updatedAt: serverTimestamp()
                    });

                    console.log(`Temps moyen de service mis à jour: ${averageServiceTime} -> ${Math.round(newAverageServiceTime * 10) / 10} minutes`);
                }
            }

            // Réinitialiser l'état de chargement
            if (typeof setLoading === 'function') {
                if (typeof loading === 'boolean') {
                    setLoading(false);
                } else if (loading && typeof loading === 'object') {
                    setLoading(Object.assign({}, loading, { updatingEstimates: false }));
                }
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de la mise à jour des estimations:", error);
            setError("Erreur lors de la mise à jour des estimations de temps d'attente");

            if (typeof setLoading === 'function') {
                if (typeof loading === 'boolean') {
                    setLoading(false);
                } else if (loading && typeof loading === 'object') {
                    setLoading(Object.assign({}, loading, { updatingEstimates: false }));
                }
            }

            return false;
        }
    };

    const value = {
        queues,
        currentQueue,
        clients,
        waitingClients,
        servedClients,
        canceledClients,
        loading,
        error,
        createQueue,
        updateQueue,
        deleteQueue,
        setCurrentQueue,
        addClient,
        updateClient,
        callNextClient,
        serveClient,
        cancelClient,
        markNoShow,
        getClient,
        getQueue,
        getQueueStats,
        deleteClient,
        clearQueue,
        updateWaitingTimesEstimates
    };

    return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
};

export const useQueue = (): QueueContextType => {
    const context = useContext(QueueContext);

    if (context === undefined) {
        throw new Error('useQueue doit être utilisé à l\'intérieur d\'un QueueProvider');
    }

    return context;
};