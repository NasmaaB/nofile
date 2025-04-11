'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
    type Firestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { Queue, Client, QueueSettings, QueueStats } from '@/types';
import { generateId, calculateQueueStats } from '@/lib/utils';

interface QueueContextType {
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
    getQueueStats: (queueId: string) => Promise<QueueStats>;
    deleteClient: (id: string) => Promise<void>;
    clearQueue: () => Promise<void>;
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

            snapshot.forEach((doc) => {
                batch.push(updateDoc(doc.ref, {
                    position: increment(-1)
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

                snapshot.forEach((doc) => {
                    batch.push(updateDoc(doc.ref, {
                        position: increment(-1)
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
    const updateQueueStats = async (queueId: string): Promise<void> => {
        try {
            const clientsRef = collection(db, 'clients');
            const q = query(
                clientsRef,
                where('queueId', '==', queueId),
                where('status', '==', 'served'),
                orderBy('servedAt', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const servedClients: any[] = [];

            snapshot.forEach((doc) => {
                servedClients.push(doc.data());
            });

            const stats = calculateQueueStats(servedClients);

            await updateDoc(doc(db, 'queues', queueId), {
                'stats.avgWaitTime': stats.avgWaitTime,
                'stats.maxWaitTime': stats.maxWaitTime,
                'stats.totalServed': stats.totalServed
            });
        } catch (err) {
            console.error('Erreur lors de la mise à jour des statistiques:', err);
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

                snapshot.forEach((doc) => {
                    batch.push(updateDoc(doc.ref, {
                        position: increment(-1)
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
        getQueueStats,
        deleteClient,
        clearQueue
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