import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WaitingTimeData {
    date: string;
    avgWaitTime: number;
    maxWaitTime?: number;
    minWaitTime?: number;
}

interface WaitingTimeChartProps {
    data: WaitingTimeData[];
    title?: string;
    description?: string;
}

const WaitingTimeChart: React.FC<WaitingTimeChartProps> = ({
    data,
    title = "Temps d'attente moyen",
    description = "Évolution du temps d'attente sur la période"
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e08283" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#e08283" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                formatter={(value) => [`${value} minutes`, '']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="avgWaitTime"
                                name="Temps moyen"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorAvg)"
                            />
                            {data[0]?.maxWaitTime !== undefined && (
                                <Area
                                    type="monotone"
                                    dataKey="maxWaitTime"
                                    name="Temps max"
                                    stroke="#e08283"
                                    fillOpacity={1}
                                    fill="url(#colorMax)"
                                />
                            )}
                            {data[0]?.minWaitTime !== undefined && (
                                <Area
                                    type="monotone"
                                    dataKey="minWaitTime"
                                    name="Temps min"
                                    stroke="#82ca9d"
                                    fillOpacity={1}
                                    fill="url(#colorMin)"
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="aspect-[16/9] bg-muted rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground">Aucune donnée disponible</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default WaitingTimeChart; 