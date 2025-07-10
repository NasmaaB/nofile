'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Client, Queue } from '@/types/types';

interface WaitingClientsListProps {
    clients: Client[];
    currentClientId?: string;
    queue?: Queue | null;
}

export function WaitingClientsList({ clients, currentClientId, queue }: WaitingClientsListProps) {
    const fadeAnimation = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    return (
        <div className="space-y-2 max-h-[calc(100vh-300px)] sm:max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/10 scrollbar-track-transparent">
            {currentClientId && (
                <div className="text-sm text-muted-foreground mb-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                        <User className="h-3 w-3 mr-1" />
                        Votre ticket est en surbrillance dans la liste
                    </span>
                </div>
            )}

            {clients.length === 0 ? (
                <motion.div {...fadeAnimation} className="py-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                        Aucun client en attente, soyez le premier !
                    </p>
                </motion.div>
            ) : (
                <AnimatePresence initial={false}>
                    {clients.map((client, index) => {
                        const isCurrentClient = currentClientId === client.id;

                        return (
                            <motion.div
                                key={client.clientUid || client.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: isCurrentClient ? [1, 1.02, 1] : 1,
                                    transition: {
                                        scale: isCurrentClient ? {
                                            repeat: Infinity,
                                            repeatType: "reverse",
                                            duration: 2
                                        } : {}
                                    }
                                }}
                                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border",
                                    isCurrentClient
                                        ? "bg-primary/10 border-primary/30 shadow-sm"
                                        : "bg-card border-border"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                        isCurrentClient
                                            ? "bg-primary text-primary-foreground"
                                            : index === 0
                                                ? "bg-primary/20 text-primary"
                                                : index < 3
                                                    ? "bg-amber-500/20 text-amber-600"
                                                    : "bg-muted text-muted-foreground"
                                    )}>
                                        {client.position || index + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm leading-tight flex items-center gap-1">
                                            {isCurrentClient ? (
                                                <span className="font-bold">{client.name}</span>
                                            ) : (
                                                client.name.split(' ')[0]
                                            )}
                                            {isCurrentClient && (
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 px-1 bg-primary/10 text-primary border-primary/20">
                                                    Vous
                                                </Badge>
                                            )}
                                        </div>
                                        {isCurrentClient && (
                                            <div className="text-xs text-muted-foreground">#{client.token}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "text-sm font-medium",
                                        isCurrentClient && "text-primary"
                                    )}>
                                        ~{client.estimatedWaitTime} min
                                    </div>
                                    <div className="text-xs text-muted-foreground">d'attente</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            )}
        </div>
    );
} 