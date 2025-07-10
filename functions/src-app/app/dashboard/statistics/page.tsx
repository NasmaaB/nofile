'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Download
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useQueue } from '@/context/queue-context';
import { useAuth } from '@/context/auth-context';
import LoadingSpinner from '@/components/common/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Importation des composants statistics
import StatsOverview from '@/components/statistics/stats-overview';
import WaitingTimeChart from '@/components/statistics/waiting-time-chart';
import DailyClientsChart from '@/components/statistics/daily-clients-chart';
import HourlyTrafficChart from '@/components/statistics/hourly-traffic-chart';

// Données d'exemple pour les graphiques
const waitingTimeData = [
    { date: '01/04', avgWaitTime: 10, maxWaitTime: 18, minWaitTime: 5 },
    { date: '02/04', avgWaitTime: 8, maxWaitTime: 15, minWaitTime: 4 },
    { date: '03/04', avgWaitTime: 12, maxWaitTime: 22, minWaitTime: 7 },
    { date: '04/04', avgWaitTime: 9, maxWaitTime: 16, minWaitTime: 5 },
    { date: '05/04', avgWaitTime: 7, maxWaitTime: 14, minWaitTime: 3 },
    { date: '06/04', avgWaitTime: 8.5, maxWaitTime: 17, minWaitTime: 4 },
    { date: '07/04', avgWaitTime: 11, maxWaitTime: 20, minWaitTime: 6 },
];

const dailyClientsData = [
    { date: '01/04', total: 35, served: 32, canceled: 2, noShow: 1 },
    { date: '02/04', total: 42, served: 38, canceled: 3, noShow: 1 },
    { date: '03/04', total: 28, served: 25, canceled: 2, noShow: 1 },
    { date: '04/04', total: 45, served: 40, canceled: 3, noShow: 2 },
    { date: '05/04', total: 38, served: 34, canceled: 3, noShow: 1 },
    { date: '06/04', total: 30, served: 27, canceled: 2, noShow: 1 },
    { date: '07/04', total: 29, served: 26, canceled: 2, noShow: 1 },
];

const hourlyTrafficData = [
    { hour: '8h', clients: 5, average: 4 },
    { hour: '9h', clients: 12, average: 10 },
    { hour: '10h', clients: 18, average: 15 },
    { hour: '11h', clients: 25, average: 20 },
    { hour: '12h', clients: 15, average: 12 },
    { hour: '13h', clients: 10, average: 8 },
    { hour: '14h', clients: 20, average: 18 },
    { hour: '15h', clients: 22, average: 20 },
    { hour: '16h', clients: 28, average: 25 },
    { hour: '17h', clients: 16, average: 15 },
    { hour: '18h', clients: 8, average: 10 },
    { hour: '19h', clients: 5, average: 5 },
    { hour: '20h', clients: 2, average: 3 },
];

export default function StatisticsPage() {
    const searchParams = useSearchParams();
    const { queues, currentQueue, setCurrentQueue } = useQueue();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('7days');

    // Récupérer l'ID de la file d'attente depuis les paramètres d'URL
    const queueId = searchParams?.get('queueId');

    // Si un queueId est fourni dans l'URL, définir la file d'attente actuelle
    useEffect(() => {
        if (queueId) {
            const queue = queues.find(q => q.id === queueId);
            if (queue) {
                setCurrentQueue(queue);
            }
        }
    }, [queueId, queues, setCurrentQueue]);

    // Période couverte par les statistiques
    const getTimeRangeLabel = () => {
        switch (timeRange) {
            case 'today':
                return 'Aujourd\'hui';
            case 'yesterday':
                return 'Hier';
            case '7days':
                return '7 derniers jours';
            case '30days':
                return '30 derniers jours';
            case 'month':
                return 'Ce mois-ci';
            case 'year':
                return 'Cette année';
            default:
                return '7 derniers jours';
        }
    };

    // Animation pour les cartes
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };

    // Dans une implémentation réelle, ces données viendraient d'une API ou d'un calcul
    const statsData = {
        totalClients: 247,
        avgWaitTime: 8.5,
        servedClients: 215,
        cancelRate: 12.9,
        changes: {
            totalClients: 12,
            avgWaitTime: -5,
            servedClients: 8,
            cancelRate: -2
        }
    };

    if (loading) {
        return <LoadingSpinner text="Chargement des statistiques..." />;
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Statistiques</h1>
                    <p className="text-muted-foreground">
                        Analyse de performance et tendances
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Sélecteur de file d'attente */}
                    <Select
                        value={currentQueue?.id || ''}
                        onValueChange={(value) => {
                            const queue = queues.find(q => q.id === value);
                            if (queue) {
                                setCurrentQueue(queue);
                            }
                        }}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sélectionner une file" />
                        </SelectTrigger>
                        <SelectContent>
                            {queues.map((queue) => (
                                <SelectItem key={queue.id} value={queue.id}>
                                    {queue.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sélecteur de période */}
                    <Select
                        value={timeRange}
                        onValueChange={setTimeRange}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Aujourd'hui</SelectItem>
                            <SelectItem value="yesterday">Hier</SelectItem>
                            <SelectItem value="7days">7 derniers jours</SelectItem>
                            <SelectItem value="30days">30 derniers jours</SelectItem>
                            <SelectItem value="month">Ce mois-ci</SelectItem>
                            <SelectItem value="year">Cette année</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Période sélectionnée */}
            <div className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Statistiques pour la période: <span className="font-medium ml-1">{getTimeRangeLabel()}</span>
            </div>

            {/* Statistiques générales */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <StatsOverview
                    totalClients={statsData.totalClients}
                    avgWaitTime={statsData.avgWaitTime}
                    servedClients={statsData.servedClients}
                    cancelRate={statsData.cancelRate}
                    changes={statsData.changes}
                />
            </motion.div>

            {/* Graphiques */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Graphique du temps d'attente */}
                <WaitingTimeChart data={waitingTimeData} />

                {/* Graphique de fréquentation */}
                <DailyClientsChart data={dailyClientsData} />
            </div>

            {/* Statistiques par heure */}
            <HourlyTrafficChart data={hourlyTrafficData} />
        </div>
    );
}