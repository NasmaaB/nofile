'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useQueue } from '@/context/queue-context';
import {
    Home,
    ListOrdered,
    Users,
    BarChart2,
    Settings,
    LogOut,
    CreditCard,
    ChevronDown,
    ChevronRight,
    Plus,
    ShieldAlert
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Logo from '@/components/common/logo';

interface SidebarProps {
    className?: string;
}

// Composant mémorisé pour chaque file d'attente
const QueueItem = React.memo(({ child }: { child: any }) => (
    <Link
        href={child.href}
        onClick={child.onClick}
        className={cn(
            'flex items-center p-2 rounded-md text-sm transition-colors duration-200',
            child.active
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-accent/50 hover:text-accent-foreground'
        )}
    >
        <span className="truncate">{child.name}</span>
    </Link>
));

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    const pathname = usePathname();
    const { logOut, user } = useAuth();
    const { queues, currentQueue, setCurrentQueue } = useQueue();
    const [queuesExpanded, setQueuesExpanded] = useState(true);

    // Déterminer l'abonnement et ses limites
    const subscription = user?.subscription || 'free';

    // Définir les étiquettes et limites avec une annotation de type
    const subscriptionLabels: Record<string, string> = {
        free: 'Gratuit',
        basic: 'Basique',
        premium: 'Premium'
    };

    const subscriptionLabel = subscriptionLabels[subscription] || 'Gratuit';

    const maxQueueLimits: Record<string, number> = {
        free: 1,
        basic: 3,
        premium: 10
    };

    const maxQueues = maxQueueLimits[subscription] || 1;

    const canCreateQueue = queues.length < maxQueues;

    // Déconnexion
    const handleLogout = useCallback(async () => {
        await logOut();
    }, [logOut]);

    // Définition des éléments de navigation
    const navItems = useMemo(
        () => [
            {
                name: 'Tableau de bord',
                href: '/dashboard',
                icon: <Home className="h-5 w-5" />
            },
            // {
            //     name: "Files d'attente",
            //     href: '/dashboard/queues',
            //     icon: <ListOrdered className="h-5 w-5" />,
            //     dropdown: true,
            //     expanded: queuesExpanded,
            //     onExpand: () => setQueuesExpanded((prev) => !prev),
            //     children: queues.map((queue) => ({
            //         name: queue.name,
            //         href: `/dashboard/queues/${queue.id}`,
            //         active: currentQueue?.id === queue.id,
            //         onClick: () => {
            //             setCurrentQueue(queue);
            //             setQueuesExpanded(true);
            //         }
            //     }))
            // },
            {
                name: 'Clients',
                href: '/dashboard/clients',
                icon: <Users className="h-5 w-5" />
            },
            {
                name: 'Statistiques',
                href: '/dashboard/statistics',
                icon: <BarChart2 className="h-5 w-5" />
            },
            {
                name: 'Abonnement',
                href: '/dashboard/subscription',
                icon: <CreditCard className="h-5 w-5" />
            },
            {
                name: 'Paramètres',
                href: '/dashboard/settings',
                icon: <Settings className="h-5 w-5" />
            },
            ...(user?.role === 'admin' ? [
                {
                    name: 'Administration',
                    href: '/admin/update-urls',
                    icon: <ShieldAlert className="h-5 w-5" />
                }
            ] : [])
        ],
        [queues, queuesExpanded, currentQueue, setCurrentQueue, user?.role]
    );

    const SidebarContent = () => (
        <>
            <div className="px-3 py-4">
                <Logo className="h-10 w-auto" />
            </div>

            <div className="px-3 mb-6">
                {canCreateQueue ? (
                    <Link href="/dashboard/queues/create">
                        <Button
                            variant="gradient"
                            className="w-full justify-start"
                            leftIcon={<Plus className="h-4 w-4" />}
                            animation="glow"
                        >
                            Nouvelle file
                        </Button>
                    </Link>
                ) : (
                    <Button
                        variant="gradient"
                        className="w-full justify-start"
                        disabled
                        leftIcon={<Plus className="h-4 w-4" />}
                        animation="glow"
                    >
                        Nouvelle file
                    </Button>
                )}
                {!canCreateQueue && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Limite de {maxQueues} file{maxQueues > 1 ? 's' : ''} atteinte.
                        <Link
                            href="/dashboard/subscription"
                            className="text-primary hover:underline ml-1"
                        >
                            Passer à Premium
                        </Link>
                    </p>
                )}
            </div>

            <div className="space-y-1 px-3">
                {navItems.map((item) => (
                    <div key={item.name} className="mb-2">
                        {/*<Link
                            href={item.dropdown ? '#' : item.href}
                            onClick={item.dropdown ? item.onExpand : undefined}
                            className={cn(
                                'flex items-center justify-between p-2 rounded-md w-full transition-colors duration-200',
                                pathname === item.href
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent/50 hover:text-accent-foreground'
                            )}
                        >  */}
                        <Link
                            href={item.href}
                            onClick={undefined}
                            className={cn(
                                'flex items-center justify-between p-2 rounded-md w-full transition-colors duration-200',
                                pathname === item.href
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent/50 hover:text-accent-foreground'
                            )}
                        >
                            <div className="flex items-center">
                                <span className="mr-3 text-muted-foreground">{item.icon}</span>
                                <span>{item.name}</span>
                            </div>
                            {/* {item.dropdown && (
                                <span>
                                    {item.expanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </span>
                            )} */}

                        </Link>

                        {/* {item.dropdown && item.expanded && item.children && (
                            <motion.div
                                layout
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden pl-6 pr-2 mt-1"
                            >
                                <div className="space-y-1">
                                    {item.children.map((child) => (
                                        <QueueItem key={child.name} child={child} />
                                    ))}
                                </div>
                            </motion.div>
                        )} */}
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <div className="px-3 py-2 mb-2">
                    <div className="bg-accent/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    {user?.displayName || user?.email || 'Utilisateur'}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs text-muted-foreground ml-1">
                                        {subscriptionLabel}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Pour les écrans md et plus, le sidebar s'affiche dans un container responsive */}
            <div
                className={cn(
                    'hidden md:flex flex-col h-screen border-r bg-card/50 shadow-sm',
                    className,
                    'md:w-48 lg:w-64'
                )}
            >
                <SidebarContent />
            </div>

            {/* Pour les écrans plus petits, le sidebar est utilisé dans le Sheet du Navbar */}
            <div className={cn('md:hidden', className)}>
                <SidebarContent />
            </div>
        </>
    );
};

export default Sidebar;
