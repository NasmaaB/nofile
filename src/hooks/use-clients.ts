import { useCallback } from 'react';
import { useQueue } from './use-queues';
import { Client } from '@/types';
import { toJSDate } from '@/lib/utils';

// Type du contexte de la file d'attente
interface QueueContextType {
    clients: Client[];
    waitingClients: Client[];
    servedClients: Client[];
    canceledClients: Client[];
    addClient: (data: Partial<Client>) => Promise<string>;
    updateClient: (id: string, data: Partial<Client>) => Promise<void>;
    getClient: (id: string) => Promise<Client | null>;
    serveClient: (id: string) => Promise<void>;
    cancelClient: (id: string) => Promise<void>;
    markNoShow: (id: string) => Promise<void>;
    callNextClient: () => Promise<Client | null>;
}

export const useClients = () => {
    // useQueue() retourne un contexte qui ne peut pas être null (lance une erreur si c'est le cas)
    const queueContext = useQueue() as QueueContextType;

    const {
        clients,
        waitingClients,
        servedClients,
        canceledClients,
        addClient,
        updateClient,
        getClient,
        serveClient,
        cancelClient,
        markNoShow,
        callNextClient
    } = queueContext;

    // Fonction pour filtrer les clients par texte de recherche
    const searchClients = useCallback((query: string, clientList: Client[] = clients): Client[] => {
        if (!query.trim()) return clientList;

        const lowercaseQuery = query.toLowerCase().trim();
        return clientList.filter(client =>
            client.name.toLowerCase().includes(lowercaseQuery) ||
            (client.email && client.email.toLowerCase().includes(lowercaseQuery)) ||
            (client.phone && client.phone.toLowerCase().includes(lowercaseQuery)) ||
            (client.token && client.token.toString().toLowerCase().includes(lowercaseQuery))
        );
    }, [clients]);

    // Fonction pour trier les clients par différents critères
    const sortClients = useCallback((clientList: Client[], sortBy: string = 'position', ascending: boolean = true): Client[] => {
        return [...clientList].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'position':
                    comparison = (a.position || 0) - (b.position || 0);
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'waitTime':
                    const aWaitTime = a.estimatedWaitTime || 0;
                    const bWaitTime = b.estimatedWaitTime || 0;
                    comparison = aWaitTime - bWaitTime;
                    break;
                case 'date':
                    // Utiliser notre fonction utilitaire pour convertir en date JS
                    const aDate = toJSDate(a.createdAt);
                    const bDate = toJSDate(b.createdAt);
                    const aTime = aDate ? aDate.getTime() : 0;
                    const bTime = bDate ? bDate.getTime() : 0;
                    comparison = aTime - bTime;
                    break;
                default:
                    comparison = 0;
            }

            return ascending ? comparison : -comparison;
        });
    }, []);

    // Obtenir les clients servis aujourd'hui
    const getServedClientsToday = useCallback((): Client[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return servedClients.filter((client: Client) => {
            if (!client.servedAt) return false;

            // Utiliser notre fonction utilitaire
            const servedDate = toJSDate(client.servedAt);
            if (!servedDate) return false;

            servedDate.setHours(0, 0, 0, 0);
            return servedDate.getTime() === today.getTime();
        });
    }, [servedClients]);

    return {
        clients,
        waitingClients,
        servedClients,
        canceledClients,
        servedClientsToday: getServedClientsToday(),
        addClient,
        updateClient,
        getClient,
        serveClient,
        cancelClient,
        markNoShow,
        callNextClient,
        searchClients,
        sortClients
    };
};

export default useClients;