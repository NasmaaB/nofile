'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import {
    Bell,
    Moon,
    Sun,
    Settings,
    LogOut,
    ChevronDown,
    Users,
    LayoutDashboard,
    BarChart3,
    Settings2,
    CalendarClock,
    CreditCard,
    User,
    Loader2,
    RefreshCw,
    Search
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';

import { useTheme } from '@/context/theme-context';
import { useQueue } from '@/context/queue-context';
import { useAuth } from '@/context/auth-context';
import { User as UserType } from '@/types/index';

// Étendre le type User pour inclure displayName
interface AuthUser extends UserType {
    displayName?: string;
}

interface HeaderProps {
    className?: string;
    showSearch?: boolean;
    onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({
    className,
    showSearch = false,
    onSearch
}) => {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user, logOut } = useAuth();
    const { currentQueue, queues, setCurrentQueue } = useQueue();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [pageTitle, setPageTitle] = useState('Tableau de bord');
    const [pageIcon, setPageIcon] = useState<React.ReactNode>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadNotifications, setUnreadNotifications] = useState(3);
    const router = useRouter();

    // Mettre à jour le titre et l'icône de la page en fonction du chemin
    useEffect(() => {
        if (pathname === '/dashboard') {
            setPageTitle('Tableau de bord');
            setPageIcon(<LayoutDashboard className="h-5 w-5 mr-2 text-primary" />);
        } else if (pathname.startsWith('/dashboard/queues')) {
            if (pathname.includes('/create')) {
                setPageTitle('Créer une file d\'attente');
            } else if (pathname.includes('/queues/') && currentQueue) {
                setPageTitle(currentQueue.name);
            } else {
                setPageTitle('Files d\'attente');
            }
            setPageIcon(<CalendarClock className="h-5 w-5 mr-2 text-primary" />);
        } else if (pathname.startsWith('/dashboard/clients')) {
            setPageTitle('Gestion des clients');
            setPageIcon(<Users className="h-5 w-5 mr-2 text-primary" />);
        } else if (pathname.startsWith('/dashboard/statistics')) {
            setPageTitle('Statistiques');
            setPageIcon(<BarChart3 className="h-5 w-5 mr-2 text-primary" />);
        } else if (pathname.startsWith('/dashboard/settings')) {
            setPageTitle('Paramètres');
            setPageIcon(<Settings2 className="h-5 w-5 mr-2 text-primary" />);
        } else if (pathname.startsWith('/dashboard/subscription')) {
            setPageTitle('Abonnement');
            setPageIcon(<CreditCard className="h-5 w-5 mr-2 text-primary" />);
        }
    }, [pathname, currentQueue]);

    // Mettre à jour l'heure actuelle
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Mise à jour chaque minute

        return () => clearInterval(timer);
    }, []);

    // Simuler un chargement pour le changement de file d'attente
    const handleQueueChange = (value: string) => {
        setIsLoading(true);
        const queue = queues.find(q => q.id === value);

        setTimeout(() => {
            if (queue) setCurrentQueue(queue);
            setIsLoading(false);
        }, 300);
    };

    // Gérer la recherche
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    // Rafraîchir la page
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-background/95 backdrop-blur-sm border-b flex h-16 items-center justify-between px-4 md:px-6",
                className
            )}
        >
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center">
                    {pageIcon}
                    <div>
                        <h1 className="text-xl font-semibold truncate max-w-[200px] lg:max-w-full">{pageTitle}</h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">
                            {formatDate(currentTime, 'EEEE d MMMM yyyy')}
                        </p>
                    </div>
                </div>

                {pathname.includes('/clients') && currentQueue && (
                    <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1 py-1.5 px-2.5 border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => router.push(`/dashboard/queues/${currentQueue.id}`)}
                    >
                        <CalendarClock className="h-3.5 w-3.5 mr-1 text-primary" />
                        <span className="font-medium text-primary">{currentQueue.name}</span>
                    </Badge>
                )}

                {/* File d'attente pour mobile si une seule file existe */}
                {currentQueue && queues.length === 1 && !pathname.includes('/clients') && (
                    <div className="flex items-center lg:hidden pb-1 pt-1">
                        <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1 py-1.5 px-2.5 border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => router.push(`/dashboard/queues/${currentQueue.id}`)}
                        >
                            <CalendarClock className="h-3.5 w-3.5 mr-1 text-primary" />
                            <span className="font-medium text-primary">{currentQueue.name}</span>
                        </Badge>
                    </div>
                )}

                {/* Barre de recherche conditionnelle */}
                {showSearch && (
                    <div className="relative ml-auto hidden md:block flex-1 max-w-sm lg:max-w-md mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 pr-4 h-9 w-full"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5">
                {/* Bouton de rafraîchissement */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleRefresh}
                                className="hidden sm:flex text-muted-foreground hover:text-foreground h-9 w-9"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Rafraîchir</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Sélecteur de file d'attente */}
                {queues.length > 0 && pathname.includes('/clients') && (
                    <div className="hidden lg:block mr-1 relative">
                        <Select
                            value={currentQueue?.id}
                            onValueChange={handleQueueChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-[180px] h-9 text-sm">
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        <span>Chargement...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Sélectionner une file" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {queues.map(queue => (
                                    <SelectItem key={queue.id} value={queue.id}>
                                        {queue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Thème */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="text-muted-foreground hover:text-foreground h-9 w-9"
                                aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Notification */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground relative h-9 w-9"
                            aria-label="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex justify-between items-center">
                            <span>Notifications</span>
                            {unreadNotifications > 0 && (
                                <Badge variant="secondary" className="text-xs font-medium">
                                    {unreadNotifications} nouvelles
                                </Badge>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto py-1">
                            <div className="px-2 py-2 hover:bg-accent rounded-md cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm">Nouveau client</span>
                                    <Badge variant="outline" className="text-xs ml-2">Nouveau</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">Jean Dupont attend son tour depuis 10 minutes</p>
                                <p className="text-xs text-muted-foreground mt-1">Il y a 2 minutes</p>
                            </div>
                            <div className="px-2 py-2 hover:bg-accent rounded-md cursor-pointer mt-1">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm">Limite d'attente</span>
                                    <Badge variant="outline" className="text-xs ml-2">Important</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">3 clients attendent depuis plus de 15 minutes</p>
                                <p className="text-xs text-muted-foreground mt-1">Il y a 10 minutes</p>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <div className="p-2 text-center">
                            <Button variant="ghost" size="sm" className="w-full text-xs text-primary">
                                Voir toutes les notifications
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Profil utilisateur */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 flex items-center gap-2 pl-1 pr-1 ml-1">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Utilisateur'} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden lg:block text-sm font-normal truncate max-w-[100px]">
                                {user?.displayName || 'Utilisateur'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 hidden lg:block text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="flex items-center justify-start gap-2 p-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Utilisateur'} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{user?.displayName || 'Utilisateur'}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {user?.email || ''}
                                </span>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Paramètres</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={logOut}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Déconnexion</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.header>
    );
};

export default Header;