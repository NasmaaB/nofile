'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Users,
    CheckCircle,
    Clock,
    Bell,
    Search,
    Plus,
    ChevronRight,
    XCircle,
    SlidersHorizontal,
    Phone,
    Mail
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueue } from '@/context/queue-context';
import { Client } from '@/types';
import { formatPhoneNumber, timeAgo } from '@/lib/utils';

export default function ClientsPage() {
    const router = useRouter();
    const { currentQueue, waitingClients, servedClients, canceledClients } = useQueue();
    const [activeTab, setActiveTab] = useState<'waiting' | 'served' | 'canceled'>('waiting');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filtrer les clients en fonction de la recherche
    const filterClients = (clients: Client[]) => {
        if (!searchQuery.trim()) return clients;

        const query = searchQuery.toLowerCase().trim();
        return clients.filter(client =>
            client.name.toLowerCase().includes(query) ||
            (client.email && client.email.toLowerCase().includes(query)) ||
            (client.phone && client.phone.toLowerCase().includes(query)) ||
            (client.token && client.token.toString().toLowerCase().includes(query))
        );
    };

    // Obtenir les clients selon l'onglet actif
    const getActiveClients = () => {
        switch (activeTab) {
            case 'waiting':
                return filterClients(waitingClients);
            case 'served':
                return filterClients(servedClients);
            case 'canceled':
                return filterClients(canceledClients);
            default:
                return [];
        }
    };

    const activeClients = getActiveClients();

    return (
        <div className="space-y-6">
            {/* En-tête et recherche */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des clients</h1>
                    <p className="text-muted-foreground">
                        {currentQueue
                            ? `File d'attente active: ${currentQueue.name}`
                            : 'Aucune file d\'attente sélectionnée'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un client..."
                            className="pl-9 w-full md:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={isFiltersOpen ? 'bg-accent/20' : ''}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="gradient"
                        animation="glow"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => router.push('/dashboard/clients/add')}
                    >
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* Filtres avancés */}
            {isFiltersOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border rounded-lg p-4"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Filtres avancés</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsFiltersOpen(false)}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Filtres supplémentaires ici */}
                    </div>
                </motion.div>
            )}

            {/* Onglets de statut */}
            <div className="flex border-b">
                <button
                    className={`px-4 py-2 flex items-center ${activeTab === 'waiting' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('waiting')}
                >
                    <Users className="h-4 w-4 mr-2" />
                    En attente ({waitingClients.length})
                </button>

                <button
                    className={`px-4 py-2 flex items-center ${activeTab === 'served' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('served')}
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Servis ({servedClients.length})
                </button>

                <button
                    className={`px-4 py-2 flex items-center ${activeTab === 'canceled' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('canceled')}
                >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annulés ({canceledClients.length})
                </button>
            </div>

            {/* Liste des clients */}
            <div className="space-y-4">
                {activeClients.length === 0 ? (
                    <div className="text-center py-12 bg-accent/5 rounded-lg border border-dashed">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            {activeTab === 'waiting' && <Clock className="h-6 w-6 text-muted-foreground" />}
                            {activeTab === 'served' && <CheckCircle className="h-6 w-6 text-muted-foreground" />}
                            {activeTab === 'canceled' && <XCircle className="h-6 w-6 text-muted-foreground" />}
                        </div>
                        <h3 className="text-lg font-medium mb-1">Aucun client trouvé</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {activeTab === 'waiting'
                                ? 'Il n\'y a actuellement aucun client en attente.'
                                : activeTab === 'served'
                                    ? 'Aucun client n\'a été servi pour le moment.'
                                    : 'Aucun client n\'a été annulé pour le moment.'}
                        </p>

                        {activeTab === 'waiting' && (
                            <Button
                                variant="gradient"
                                leftIcon={<Plus className="h-4 w-4" />}
                                onClick={() => router.push('/dashboard/clients/add')}
                            >
                                Ajouter un client
                            </Button>
                        )}
                    </div>
                ) : (
                    <div>
                        {activeClients.map((client) => (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center">
                                        <div className="mr-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {client.token}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium">{client.name}</h3>
                                            <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                                                {client.phone && (
                                                    <span className="flex items-center">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {formatPhoneNumber(client.phone)}
                                                    </span>
                                                )}

                                                {client.email && (
                                                    <span className="flex items-center">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {client.email}
                                                    </span>
                                                )}

                                                <span className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {client.createdAt && timeAgo(client.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {activeTab === 'waiting' && (
                                            <>
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
                                                    leftIcon={<ChevronRight className="h-4 w-4" />}
                                                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                                >
                                                    Servir
                                                </Button>
                                            </>
                                        )}

                                        {(activeTab === 'served' || activeTab === 'canceled') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                            >
                                                Détails
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Informations supplémentaires */}
                                {client.notes && (
                                    <div className="mt-3 pt-3 border-t text-sm">
                                        <span className="font-medium">Notes:</span> {client.notes}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {/* Pagination ou bouton "Charger plus" si nécessaire */}
                    </div>
                )}
            </div>
        </div>
    );
}