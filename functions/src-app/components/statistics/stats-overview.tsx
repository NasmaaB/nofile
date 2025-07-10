import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Users, Clock, TrendingUp } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    changePercentage: number;
    icon: React.ReactNode;
    gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, changePercentage, icon, gradient }) => {
    const isPositive = changePercentage >= 0;
    const isPositiveGood = title !== 'Taux d\'annulation'; // Pour le taux d'annulation, une baisse est positive
    const showGreenArrow = (isPositive && isPositiveGood) || (!isPositive && !isPositiveGood);

    return (
        <Card className={`bg-gradient-to-br ${gradient}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <div className="flex items-center text-xs mt-1">
                    {showGreenArrow ? (
                        <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                        <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={showGreenArrow ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                        {Math.abs(changePercentage)}%
                    </span>
                    <span className="text-muted-foreground ml-1">vs période précédente</span>
                </div>
            </CardContent>
        </Card>
    );
};

interface StatsOverviewProps {
    totalClients: number;
    avgWaitTime: number;
    servedClients: number;
    cancelRate: number;
    changes: {
        totalClients: number;
        avgWaitTime: number;
        servedClients: number;
        cancelRate: number;
    };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
    totalClients,
    avgWaitTime,
    servedClients,
    cancelRate,
    changes
}) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total des clients"
                value={totalClients}
                changePercentage={changes.totalClients}
                icon={<Users className="h-4 w-4 mr-2 text-primary" />}
                gradient="from-primary/5 to-primary/10"
            />

            <StatCard
                title="Temps d'attente moyen"
                value={`${avgWaitTime} min`}
                changePercentage={changes.avgWaitTime}
                icon={<Clock className="h-4 w-4 mr-2 text-yellow-500" />}
                gradient="from-yellow-500/5 to-yellow-500/10"
            />

            <StatCard
                title="Clients servis"
                value={servedClients}
                changePercentage={changes.servedClients}
                icon={<Users className="h-4 w-4 mr-2 text-green-500" />}
                gradient="from-green-500/5 to-green-500/10"
            />

            <StatCard
                title="Taux d'annulation"
                value={`${cancelRate}%`}
                changePercentage={changes.cancelRate}
                icon={<TrendingUp className="h-4 w-4 mr-2 text-red-500" />}
                gradient="from-red-500/5 to-red-500/10"
            />
        </div>
    );
};

export default StatsOverview; 