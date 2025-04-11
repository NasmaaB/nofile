'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    CheckCircle,
    Clock,
    Bell,
    Search,
    Plus,
    ChevronRight,
    XCircle,
    Filter,
    RefreshCw,
    X,
    MoreHorizontal,
    UserCog,
    UserX,
    UserCheck,
    Phone,
    Mail,
    CalendarClock,
    Loader2,
    ArrowDownUp,
    SwitchCamera
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { useQueue } from '@/context/queue-context';
import { Client } from '@/types';
import { formatPhoneNumber, timeAgo, cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

export default function ClientsPage() {
    const router = useRouter();
    const { currentQueue, queues, setCurrentQueue, waitingClients, servedClients, canceledClients, addClient, serveClient, cancelClient } = useQueue();
    const [activeTab, setActiveTab] = useState<'waiting' | 'served' | 'canceled'>('waiting');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [changingQueue, setChangingQueue] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        phone: '',
        email: '',
        notes: ''
    });
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [processingClients, setProcessingClients] = useState<{
        [key: string]: { serving?: boolean, canceling?: boolean }
    }>({});

    // Simuler un chargement pour le rafraîchissement
    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setLastRefreshed(new Date());
        }, 800);
    };

    // Changer de file d'attente
    const handleQueueChange = (queueId: string) => {
        setChangingQueue(true);
        const queue = queues.find(q => q.id === queueId);

        setTimeout(() => {
            if (queue) {
                setCurrentQueue(queue);

                // Réinitialiser la recherche lors du changement de file
                setSearchQuery('');

                // Rester sur l'onglet 'waiting' pour voir immédiatement les clients en attente
                setActiveTab('waiting');

                // Rafraîchir la dernière mise à jour
                setLastRefreshed(new Date());
            }
            setChangingQueue(false);
        }, 500);
    };
    // Filtrer les clients en fonction de la recherche
    const filterClients = (clients: Client[]) => {
        if (!searchQuery.trim()) {
            // Si pas de recherche, filtrer uniquement par file d'attente
            return clients.filter(client => client.queueId === currentQueue?.id);
        }

        const query = searchQuery.toLowerCase().trim();

        // Filtrer par la recherche ET par la file d'attente actuelle
        return clients.filter(client =>
            client.queueId === currentQueue?.id && (
                client.name.toLowerCase().includes(query) ||
                (client.email && client.email.toLowerCase().includes(query)) ||
                (client.phone && client.phone.toLowerCase().includes(query)) ||
                (client.token && client.token.toString().toLowerCase().includes(query))
            )
        );
    };

    // Obtenir les clients selon l'onglet actif
    const getActiveClients = (): Client[] => {
        let clients: Client[] = [];

        // S'assurer que nous filtrons uniquement les clients de la file courante
        // Ces listes sont déjà triées dans le contexte
        switch (activeTab) {
            case 'waiting':
                clients = waitingClients;
                break;
            case 'served':
                clients = servedClients;
                break;
            case 'canceled':
                clients = canceledClients;
                break;
            default:
                clients = [];
        }

        // Appliquer la recherche si nécessaire
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            clients = clients.filter(client =>
                client.name.toLowerCase().includes(query) ||
                (client.email && client.email.toLowerCase().includes(query)) ||
                (client.phone && client.phone.toLowerCase().includes(query)) ||
                (client.token && client.token.toString().toLowerCase().includes(query))
            );
        }

        // Inverser l'ordre uniquement si sortOrder est desc
        // Sinon, conserver l'ordre déjà établi dans le contexte
        if (sortOrder === 'desc') {
            return [...clients].reverse();
        }

        return clients;
    };
    const activeClients = getActiveClients();

    // Configuration des onglets
    const tabConfig = {
        waiting: {
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            icon: <Clock className="h-4 w-4" />,
            emptyIcon: <Clock className="h-6 w-6 text-amber-500" />,
            label: 'En attente',
            count: waitingClients.length,
            emptyText: 'Il n\'y a actuellement aucun client en attente.',
            showAddButton: true
        },
        served: {
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20',
            icon: <CheckCircle className="h-4 w-4" />,
            emptyIcon: <CheckCircle className="h-6 w-6 text-green-500" />,
            label: 'Servis',
            count: servedClients.length,
            emptyText: 'Aucun client n\'a été servi pour le moment.',
            showAddButton: false
        },
        canceled: {
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
            icon: <XCircle className="h-4 w-4" />,
            emptyIcon: <XCircle className="h-6 w-6 text-red-500" />,
            label: 'Annulés',
            count: canceledClients.length,
            emptyText: 'Aucun client n\'a été annulé pour le moment.',
            showAddButton: false
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
    };

    // Intercepter le raccourci clavier pour la recherche
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ouvrir la recherche avec Cmd/Ctrl + K ou /
            if ((e.metaKey || e.ctrlKey) && e.key === 'k' || (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT')) {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fonction pour ajouter un client avec la file d'attente actuelle
    const handleAddClient = async () => {
        if (!newClient.name.trim()) return;

        setIsAddingClient(true);
        setSuccessMessage(null); // Réinitialiser le message de succès

        // Capturer la référence actuelle à la file d'attente
        const targetQueue = currentQueue;

        try {
            // Vérifier que nous avons une file d'attente active
            if (!targetQueue) {
                throw new Error("Aucune file d'attente sélectionnée");
            }

            // Sauvegarder l'ID de la file actuelle dans localStorage
            // Cela garantit que même après l'opération, nous resterons sur cette file
            localStorage.setItem('lastQueueId', targetQueue.id);

            // Créer un objet partiel de client avec les données du formulaire
            const clientData = {
                name: newClient.name.trim(),
                phone: newClient.phone,
                email: newClient.email,
                notes: newClient.notes
            };

            // Utiliser la fonction du contexte pour ajouter le client
            const clientId = await addClient(clientData);

            console.log('Client ajouté avec succès, ID:', clientId);

            // Réinitialiser le formulaire
            setNewClient({
                name: '',
                phone: '',
                email: '',
                notes: ''
            });

            // S'assurer que l'onglet actif est "waiting" pour voir le nouveau client
            setActiveTab('waiting');

            // Réinitialiser la recherche pour s'assurer que tous les clients sont visibles
            setSearchQuery('');

            // Rafraîchir la liste
            handleRefresh();

            setIsAddingClient(false);
            setIsAddClientModalOpen(false);

            // Définir un message de succès qui mentionne la file d'attente
            setSuccessMessage(`Le client ${clientData.name} a été ajouté avec succès à la file d'attente "${targetQueue.name}".`);

            // Effacer le message après 5 secondes
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (error) {
            console.error('Erreur lors de l\'ajout du client:', error);
            setIsAddingClient(false);

            // Afficher une notification d'erreur
            alert(`Erreur lors de l'ajout du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    };

    // Fonction mise à jour pour servir un client directement
    const handleServeClient = async (clientId: string) => {
        try {
            // Capturer la référence actuelle à la file d'attente
            const targetQueue = currentQueue;

            // Vérifier que nous avons une file d'attente active
            if (!targetQueue) {
                throw new Error("Aucune file d'attente sélectionnée");
            }

            // Sauvegarder l'ID de la file actuelle dans localStorage
            // Cela garantit que même après l'opération, nous resterons sur cette file
            localStorage.setItem('lastQueueId', targetQueue.id);

            // Mettre à jour l'état de traitement
            setProcessingClients(prev => ({
                ...prev,
                [clientId]: { ...prev[clientId], serving: true }
            }));

            setSuccessMessage(null);

            // Appeler la fonction du contexte pour servir le client
            await serveClient(clientId);

            // Réinitialiser l'état de traitement
            setProcessingClients(prev => ({
                ...prev,
                [clientId]: { ...prev[clientId], serving: false }
            }));

            // Rafraîchir la liste
            handleRefresh();

            // Option: basculer vers l'onglet "servis" pour voir le client servi
            // Vous pouvez commenter cette ligne si vous ne voulez pas changer d'onglet
            // setActiveTab('served');

            // Afficher un message de succès
            setSuccessMessage(`Client servi avec succès dans la file d'attente "${targetQueue.name}".`);

            // Masquer le message après 3 secondes
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (error) {
            // Réinitialiser l'état de traitement en cas d'erreur
            setProcessingClients(prev => ({
                ...prev,
                [clientId]: { ...prev[clientId], serving: false }
            }));

            console.error('Erreur lors du service du client:', error);
            alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
        }
    };

    // Fonction mise à jour pour annuler un client
    const handleCancelClient = async (clientId: string) => {
        try {
            // Confirmer l'annulation
            if (!confirm("Voulez-vous vraiment annuler ce client ?")) {
                return;
            }

            // Capturer la référence actuelle à la file d'attente
            const targetQueue = currentQueue;

            // Vérifier que nous avons une file d'attente active
            if (!targetQueue) {
                throw new Error("Aucune file d'attente sélectionnée");
            }

            // Sauvegarder l'ID de la file actuelle dans localStorage
            // Cela garantit que même après l'opération, nous resterons sur cette file
            localStorage.setItem('lastQueueId', targetQueue.id);

            // Mettre à jour l'état de traitement
            setProcessingClients(prev => ({
                ...prev,
                [clientId]: { ...prev[clientId], canceling: true }
            }));

            // Appeler la fonction du contexte pour annuler le client
            await cancelClient(clientId);

            // Réinitialiser l'état de traitement
            setProcessingClients(prev => ({
                ...prev,
                [clientId]: { ...prev[clientId], canceling: false }
            }));

            // Rafraîchir la liste
            handleRefresh();

            // Ne pas changer d'onglet, rester sur l'onglet courant
            // Afficher un message de succès
            setSuccessMessage(`Client annulé avec succès dans la file d'attente "${targetQueue.name}".`);

            // Masquer le message après 3 secondes
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (error) {
            // Réinitialiser l'état de traitement en cas d'erreur
            setProcessingClients(prev => ({
                ...prev,
                [clientId]: { ...prev[clientId], canceling: false }
            }));

            console.error('Erreur lors de l\'annulation du client:', error);
            alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
        }
    };

    return (
        <div className="space-y-4 pb-8 pt-1">
            {/* En-tête pour les petits écrans avec file d'attente actuelle */}
            {currentQueue && queues.length > 1 && (
                <div className="flex items-center justify-between lg:hidden pb-1 pt-1">
                    <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1 py-1.5 px-2.5 border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => router.push(`/dashboard/queues/${currentQueue.id}`)}
                    >
                        <CalendarClock className="h-3.5 w-3.5 mr-1 text-primary" />
                        <span className="font-medium text-primary">{currentQueue.name}</span>
                    </Badge>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 gap-1.5"
                                disabled={changingQueue || queues.length <= 1}
                            >
                                {changingQueue ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                ) : (
                                    <SwitchCamera className="h-3.5 w-3.5 mr-1" />
                                )}
                                <span>Changer de file</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Sélectionner une file</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={currentQueue.id} onValueChange={handleQueueChange}>
                                {queues.map(queue => (
                                    <DropdownMenuRadioItem
                                        key={queue.id}
                                        value={queue.id}
                                        className={queue.id === currentQueue.id ? "font-medium" : ""}
                                    >
                                        {queue.name}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
            {/* {queues.length > 1 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">File d'attente</h3>
                    <div className="flex flex-wrap gap-2">
                        {queues.map(queue => (
                            <Badge
                                key={queue.id}
                                variant={queue.id === currentQueue?.id ? "secondary" : "outline"}
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleQueueChange(queue.id)} // AJOUTÉ: Fonction pour changer la file lors du clic
                            >
                                {queue.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            )} */}
            {/* Barre de recherche et actions principales - Layout plus compact */}
            <div className="flex items-center gap-3 justify-between z-20 bg-background pt-2 pb-1">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-input"
                        placeholder="Rechercher un client... (/ ou Ctrl+K)"
                        className="pl-9 pr-24 w-full bg-background/80 border-muted-foreground/20 focus-visible:bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent/40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Rafraîchir la liste</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn("h-7 w-7", sortOrder === 'desc' && "bg-accent/40")}
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    >
                                        <ArrowDownUp className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Trier par {sortOrder === 'asc' ? 'ordre décroissant' : 'ordre croissant'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <SheetHeader>
                                    <SheetTitle>Filtres avancés</SheetTitle>
                                    <SheetDescription>
                                        Filtrez les clients selon différents critères
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-6 mt-6">
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium">Statut</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Tous</Badge>
                                            <Badge variant="secondary" className="cursor-pointer">En attente</Badge>
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Servis</Badge>
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Annulés</Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium">Date d'ajout</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="cursor-pointer">Aujourd'hui</Badge>
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Semaine</Badge>
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Mois</Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium">Type de client</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Avec RDV</Badge>
                                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">Sans RDV</Badge>
                                        </div>
                                    </div>
                                </div>
                                <SheetFooter className="mt-6">
                                    <SheetClose asChild>
                                        <Button type="submit" className="w-full">Appliquer les filtres</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Modification du bouton d'ajout client actuel */}
                <div className="flex items-center gap-2 shrink-0 min-w-fit">
                    <Badge variant="outline" className="hidden md:flex gap-1 text-xs py-1 px-2 h-7 whitespace-nowrap">
                        <span className="text-muted-foreground hidden lg:inline">Mis à jour:</span>
                        <span className="text-muted-foreground lg:hidden">MàJ:</span>
                        {timeAgo(lastRefreshed)}
                    </Badge>

                    {/* Bouton d'ajout de client avec la couleur d'accent */}
                    <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="h-9 w-9 rounded-full sm:rounded-md sm:h-9 sm:w-auto sm:px-3 transition-all
                                bg-accent text-accent-foreground hover:bg-accent/90
                                shadow-sm hover:shadow-md"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 sm:mr-1.5" />
                                <span className="hidden sm:inline font-medium">Ajouter</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un nouveau client</DialogTitle>
                                <DialogDescription>
                                    Complétez les informations du client pour l'ajouter à la file d'attente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (newClient.name.trim() && !isAddingClient) {
                                        handleAddClient();
                                    }
                                }}>
                                    <div className="grid gap-2">
                                        <label htmlFor="name" className="text-sm font-medium">
                                            Nom complet <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="name"
                                            value={newClient.name}
                                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                            placeholder="Jean Dupont"
                                            className="col-span-3"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid gap-2 mt-3">
                                        <label htmlFor="phone" className="text-sm font-medium">
                                            Téléphone
                                        </label>
                                        <Input
                                            id="phone"
                                            value={newClient.phone}
                                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                            placeholder="06 12 34 56 78"
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid gap-2 mt-3">
                                        <label htmlFor="email" className="text-sm font-medium">
                                            Email
                                        </label>
                                        <Input
                                            id="email"
                                            value={newClient.email}
                                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                            placeholder="jean.dupont@exemple.fr"
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid gap-2 mt-3">
                                        <label htmlFor="notes" className="text-sm font-medium">
                                            Notes
                                        </label>
                                        <Input
                                            id="notes"
                                            value={newClient.notes}
                                            onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                                            placeholder="Informations supplémentaires..."
                                            className="col-span-3"
                                        />
                                    </div>
                                    {/* Bouton de soumission caché pour capturer l'événement Entrée */}
                                    <button type="submit" className="sr-only">Soumettre</button>
                                </form>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setNewClient({
                                            name: '',
                                            phone: '',
                                            email: '',
                                            notes: ''
                                        });
                                        setIsAddClientModalOpen(false);
                                    }}
                                    type="button"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleAddClient}
                                    disabled={!newClient.name.trim() || isAddingClient}
                                    type="button"
                                >
                                    {isAddingClient ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Ajout en cours...
                                        </>
                                    ) : (
                                        <>Ajouter à la file</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* Bouton flottant pour petits écrans */}
                <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-30 xs:hidden">
                    <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="h-5 w-5" />
                                <span className="sr-only">Ajouter un client</span>
                            </Button>
                        </DialogTrigger>
                    </Dialog>
                </div>
            </div>

            {/* Onglets avec nombre de clients */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'waiting' | 'served' | 'canceled')} className="w-full">
                {/* Version mobile (uniquement sur petits écrans) */}
                <div className="md:hidden">
                    <div className="border rounded-md p-0.5 bg-muted/20">
                        <TabsList className="w-full grid grid-cols-3 bg-transparent h-auto p-0">
                            {Object.entries(tabConfig).map(([key, tab]) => (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className="flex items-center justify-center gap-1 py-2 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <span className={cn("flex items-center", tab.color)}>
                                        {tab.icon}
                                    </span>
                                    <Badge variant="outline" className="ml-1 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                                        {tab.count}
                                    </Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Légende des onglets sur petit écran */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-2 px-1">
                        <span className={cn(activeTab === 'waiting' && 'font-medium text-foreground')}>
                            En attente ({waitingClients.length})
                        </span>
                        <span className={cn(activeTab === 'served' && 'font-medium text-foreground')}>
                            Servis ({servedClients.length})
                        </span>
                        <span className={cn(activeTab === 'canceled' && 'font-medium text-foreground')}>
                            Annulés ({canceledClients.length})
                        </span>
                    </div>
                </div>

                {/* Version pour écrans moyens et grands */}
                <div className="hidden md:block">
                    <TabsList className="w-full h-auto p-1">
                        {Object.entries(tabConfig).map(([key, tab]) => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-muted/80"
                            >
                                <span className={cn("flex items-center", tab.color)}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                                <Badge variant="outline" className="ml-1 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                                    {tab.count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {/* Contenu des onglets */}
                {Object.entries(tabConfig).map(([key, tab]) => (
                    <TabsContent key={key} value={key} className="mt-3">
                        {/* Liste vide */}
                        {activeClients.length === 0 ? (
                            <Card className="border-dashed bg-card/30">
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center mb-4",
                                        tab.bgColor
                                    )}>
                                        {tab.emptyIcon}
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">Aucun client trouvé</h3>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
                                        {tab.emptyText}
                                        {searchQuery && " Essayez une autre recherche."}
                                    </p>

                                    {tab.showAddButton && (
                                        <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    className="gap-1.5"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    <span>Ajouter un client</span>
                                                </Button>
                                            </DialogTrigger>
                                        </Dialog>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-2"
                            >
                                {activeClients.map((client) => (
                                    <motion.div
                                        key={client.id}
                                        variants={itemVariants}
                                        className="group relative"
                                        whileHover={{ y: -1 }}
                                    >
                                        <Card
                                            className={cn(
                                                "group-hover:border-primary/20 group-hover:shadow-sm transition-all duration-150",
                                                client.status === 'waiting' && "bg-gradient-to-r from-amber-500/5 to-transparent"
                                            )}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {/* Numéro de ticket */}
                                                        <div className="flex flex-col items-center justify-center min-w-10 h-10 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
                                                            <span className="text-xs text-muted-foreground">N°</span>
                                                            <span className="text-lg font-bold text-primary leading-none">
                                                                {client.token}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm truncate max-w-[140px] sm:max-w-[200px]">{client.name}</span>
                                                                {client.status === 'waiting' && client.position !== undefined && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "shrink-0 text-xs font-normal",
                                                                            client.position <= 3 ? "bg-amber-500/10 text-amber-600 border-amber-200" : ""
                                                                        )}
                                                                    >
                                                                        Pos. {client.position}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                                                {client.phone && (
                                                                    <span className="flex items-center truncate max-w-[120px]">
                                                                        <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                                                        {formatPhoneNumber(client.phone)}
                                                                    </span>
                                                                )}

                                                                {client.estimatedWaitTime !== undefined && client.status === 'waiting' && (
                                                                    <span className={cn(
                                                                        "flex items-center whitespace-nowrap",
                                                                        client.estimatedWaitTime > 15 ? "text-red-500" : "text-primary"
                                                                    )}>
                                                                        <CalendarClock className="h-3 w-3 mr-1 flex-shrink-0" />
                                                                        <span>~{client.estimatedWaitTime} min</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {activeTab === 'waiting' && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 px-2 md:px-3 hidden xs:flex items-center"
                                                                    onClick={() => router.push(`/dashboard/clients/${client.id}/notify`)}
                                                                >
                                                                    <Bell className="h-3.5 w-3.5 md:mr-1" />
                                                                    <span className="hidden md:inline">Notifier</span>
                                                                </Button>

                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="h-7 px-2 md:px-3"
                                                                    onClick={() => handleServeClient(client.id)}
                                                                    disabled={processingClients[client.id]?.serving}
                                                                >
                                                                    {processingClients[client.id]?.serving ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin md:mr-1" />
                                                                    ) : (
                                                                        <ChevronRight className="h-3.5 w-3.5 md:mr-1" />
                                                                    )}
                                                                    <span className="hidden md:inline">
                                                                        {processingClients[client.id]?.serving ? 'En cours...' : 'Servir'}
                                                                    </span>
                                                                </Button>
                                                            </>
                                                        )}

                                                        {(activeTab === 'served' || activeTab === 'canceled') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7"
                                                                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                                            >
                                                                Détails
                                                            </Button>
                                                        )}

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                                                    <UserCog className="h-4 w-4 mr-2" />
                                                                    <span>Voir les détails</span>
                                                                </DropdownMenuItem>

                                                                {activeTab === 'waiting' && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}/notify`)}>
                                                                            <Bell className="h-4 w-4 mr-2" />
                                                                            <span>Notifier</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-green-600"
                                                                            onClick={() => handleServeClient(client.id)}
                                                                            disabled={processingClients[client.id]?.serving}
                                                                        >
                                                                            {processingClients[client.id]?.serving ? (
                                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                            ) : (
                                                                                <UserCheck className="h-4 w-4 mr-2" />
                                                                            )}
                                                                            <span>{processingClients[client.id]?.serving ? 'En cours...' : 'Servir le client'}</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-red-600"
                                                                            onClick={() => handleCancelClient(client.id)}
                                                                            disabled={processingClients[client.id]?.canceling}
                                                                        >
                                                                            {processingClients[client.id]?.canceling ? (
                                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                            ) : (
                                                                                <UserX className="h-4 w-4 mr-2" />
                                                                            )}
                                                                            <span>{processingClients[client.id]?.canceling ? 'En cours...' : 'Annuler'}</span>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {client.notes !== undefined && (
                                                    <div className="mt-2 pt-2 border-t text-xs">
                                                        <p className="text-muted-foreground line-clamp-1">
                                                            <span className="font-medium">Notes:</span> {client.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}

                                {/* Pagination */}
                                {activeClients.length > 10 && (
                                    <div className="flex justify-center mt-6">
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <span>Charger plus</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Message de succès */}
            {successMessage && (
                <div className="fixed bottom-4 right-4 max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-lg p-4 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">{successMessage}</p>
                            <button
                                onClick={() => setSuccessMessage(null)}
                                className="text-xs text-green-600 mt-1 underline underline-offset-2"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}