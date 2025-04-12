'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Users, Timer, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Queue, Client } from '@/types/types';

interface QueueInfoCardProps {
    queue: Queue;
    waitingClients: Client[];
}

export function QueueInfoCard({ queue, waitingClients }: QueueInfoCardProps) {
    // Temps moyen de service par client (valeur dynamique basée sur les clients servis)
    const averageWaitTime = queue.averageServiceTime || 5;

    // Calculer le temps d'attente estimé pour toute la file
    const totalEstimatedWait = waitingClients.length * averageWaitTime;

    // Obtenir la date actuelle formatée
    const currentDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    // Mettre la première lettre en majuscule
    const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
        >
            <Card className="shadow-sm border-nofile-100 dark:border-gray-800 overflow-hidden bg-gradient-to-r from-white to-nofile-50/30 dark:from-gray-950 dark:to-nofile-900/5">
                <CardContent className="py-2 px-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="bg-nofile-100 dark:bg-nofile-900/30 p-1 rounded-full">
                                <Users className="h-3 w-3 text-nofile-600 dark:text-nofile-400" />
                            </div>
                            <span className="font-medium text-xs text-gray-700 dark:text-gray-300">File d'attente</span>
                        </div>
                        <Badge variant="outline" className="bg-nofile-50/50 dark:bg-nofile-900/10 border-nofile-100 dark:border-nofile-800/30 flex gap-0.5 items-center text-[10px] py-0 h-5 text-nofile-700 dark:text-nofile-300">
                            <CalendarDays className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[130px]">{formattedDate}</span>
                        </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-nofile-50/70 dark:bg-nofile-900/10 border border-nofile-100 dark:border-nofile-800/30 rounded p-1.5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1">
                                <Users className="h-2.5 w-2.5 text-nofile-500 dark:text-nofile-400" />
                                <span className="text-[10px] font-medium text-nofile-700 dark:text-nofile-300">En attente</span>
                            </div>
                            <p className="text-sm font-bold text-nofile-800 dark:text-nofile-200">{waitingClients.length}</p>
                        </div>

                        <div className="bg-nofile-50/70 dark:bg-nofile-900/10 border border-nofile-100 dark:border-nofile-800/30 rounded p-1.5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1">
                                <Timer className="h-2.5 w-2.5 text-nofile-500 dark:text-nofile-400" />
                                <span className="text-[10px] font-medium text-nofile-700 dark:text-nofile-300">Tps/client</span>
                            </div>
                            <p className="text-sm font-bold text-nofile-800 dark:text-nofile-200">{averageWaitTime}<span className="text-[10px] ml-0.5">min</span></p>
                        </div>

                        <div className="bg-nofile-50/70 dark:bg-nofile-900/10 border border-nofile-100 dark:border-nofile-800/30 rounded p-1.5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 text-nofile-500 dark:text-nofile-400" />
                                <span className="text-[10px] font-medium text-nofile-700 dark:text-nofile-300">Total</span>
                            </div>
                            <p className="text-sm font-bold text-nofile-800 dark:text-nofile-200">{totalEstimatedWait}<span className="text-[10px] ml-0.5">min</span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}