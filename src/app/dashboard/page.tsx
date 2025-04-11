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
    Loader2
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
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useQueue } from '@/context/queue-context';
import { Client } from '@/types';
import { formatPhoneNumber, timeAgo, cn } from '@/lib/utils';

export default function ClientsPage() {
    const router = useRouter();
    const { currentQueue, waitingClients, servedClients, canceledClients } = useQueue();
    const [activeTab, setActiveTab] = useState<'waiting' | 'served' | 'canceled'>('waiting');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    // Simuler un chargement pour le rafraîchissement
    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setLastRefreshed(new Date());
        }, 1000);
    };

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

    // Configuration des onglets
    const tabConfig = {
        waiting: {
            color: 'text-amber-500',
            bgColor: 'bg-amber-500',
            icon: <Clock className="h-4 w-4" />,
            emptyIcon: <Clock className="h-6 w-6 text-amber-500" />,
            label: 'En attente',
            count: waitingClients.length,
            emptyText: 'Il n\'y a actuellement aucun client en attente.',
            showAddButton: true
        },
        served: {
            color: 'text-green-500',
            bgColor: 'bg-green-500',
            icon: <CheckCircle className="h-4 w-4" />,
            emptyIcon: <CheckCircle className="h-6 w-6 text-green-500" />,
            label: 'Servis',
            count: servedClients.length,
            emptyText: 'Aucun client n\'a été servi pour le moment.',
            showAddButton: false
        },
        canceled: {
            color: 'text-red-500',
            bgColor: 'bg-red-500',
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
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-4 pb-8">
            {/* Barre de recherche et actions principales - Layout plus compact */}
            <div className="flex items-center gap-3 justify-between bg-background sticky top-0 z-10 pb-2 pt-1">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un client..."
                        className="pl-9 pr-24 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-[70px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
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
                                <TooltipContent>
                                    <p>Rafraîchir la liste</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
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
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="hidden md:flex gap-1 text-xs py-1 px-2 h-7 whitespace-nowrap">
                        <span className="text-muted-foreground hidden lg:inline">Mis à jour:</span>
                        <span className="text-muted-foreground lg:hidden">MàJ:</span>
                        {timeAgo(lastRefreshed)}
                    </Badge>

                    <Button
                        className="gap-1.5 whitespace-nowrap"
                        onClick={() => router.push('/dashboard/clients/add')}
                        size="sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden xs:inline">Ajouter</span>
                        <span className="xs:hidden">+</span>
                    </Button>
                </div>
            </div>

            {/* Onglets avec nombre de clients */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                    {Object.entries(tabConfig).map(([key, tab]) => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className="flex items-center justify-center gap-2 py-2 data-[state=active]:bg-muted/80"
                        >
                            <span className={cn("flex items-center", tab.color)}>
                                {tab.icon}
                            </span>
                            <span className="hidden xs:inline">{tab.label}</span>
                            <Badge variant="outline" className="ml-1 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                                {tab.count}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Contenu des onglets */}
                {Object.entries(tabConfig).map(([key, tab]) => (
                    <TabsContent key={key} value={key} className="mt-3">
                        {/* Liste vide */}
                        {activeClients.length === 0 ? (
                            <Card className="border-dashed bg-muted/10">
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center mb-4",
                                        `bg-${key === 'waiting' ? 'amber' : key === 'served' ? 'green' : 'red'}-500/10`
                                    )}>
                                        {tab.emptyIcon}
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">Aucun client trouvé</h3>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
                                        {tab.emptyText}
                                        {searchQuery && " Essayez une autre recherche."}
                                    </p>

                                    {tab.showAddButton && (
                                        <Button
                                            variant="default"
                                            className="gap-1.5"
                                            onClick={() => router.push('/dashboard/clients/add')}
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Ajouter un client</span>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-3"
                            >
                                {activeClients.map((client) => (
                                    <motion.div
                                        key={client.id}
                                        variants={itemVariants}
                                        className="group relative"
                                        whileHover={{ y: -1 }}
                                    >
                                        <Card className="group-hover:border-primary/20 group-hover:shadow-sm transition-all duration-200">
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
                                                            <h3 className="font-medium text-sm flex items-center gap-2">
                                                                <span className="truncate">{client.name}</span>
                                                                {client.status === 'waiting' && client.position && (
                                                                    <Badge variant="outline" className="shrink-0 text-xs font-normal">
                                                                        Pos. {client.position}
                                                                    </Badge>
                                                                )}
                                                            </h3>

                                                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                                                {client.phone && (
                                                                    <span className="flex items-center truncate">
                                                                        <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                                                        {formatPhoneNumber(client.phone)}
                                                                    </span>
                                                                )}

                                                                {client.estimatedWaitTime && client.status === 'waiting' && (
                                                                    <span className="flex items-center text-primary whitespace-nowrap">
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
                                                                    className="h-7 px-2 md:px-3 hidden xs:flex"
                                                                    onClick={() => router.push(`/dashboard/clients/${client.id}/notify`)}
                                                                >
                                                                    <Bell className="h-3.5 w-3.5 md:mr-1" />
                                                                    <span className="hidden md:inline">Notifier</span>
                                                                </Button>

                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="h-7 px-2 md:px-3"
                                                                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                                                >
                                                                    <ChevronRight className="h-3.5 w-3.5 md:mr-1" />
                                                                    <span className="hidden md:inline">Servir</span>
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
                                                                        <DropdownMenuItem className="text-green-600">
                                                                            <UserCheck className="h-4 w-4 mr-2" />
                                                                            <span>Servir le client</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="text-red-600">
                                                                            <UserX className="h-4 w-4 mr-2" />
                                                                            <span>Annuler</span>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
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
        </div>
    );
}