import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HourlyData {
    hour: string;
    clients: number;
    average?: number;
}

interface HourlyTrafficChartProps {
    data: HourlyData[];
    title?: string;
    description?: string;
}

const HourlyTrafficChart: React.FC<HourlyTrafficChartProps> = ({
    data,
    title = "Affluence par heure",
    description = "Répartition des clients sur la journée"
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="hour"
                                padding={{ left: 30, right: 30 }}
                                ticks={['8h', '10h', '12h', '14h', '16h', '18h', '20h']}
                            />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => [`${value} clients`, '']}
                                labelFormatter={(label) => `Heure: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="clients"
                                name="Clients"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                                strokeWidth={2}
                            />
                            {data[0]?.average !== undefined && (
                                <Line
                                    type="monotone"
                                    dataKey="average"
                                    name="Moyenne"
                                    stroke="#82ca9d"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="aspect-[21/9] bg-muted rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground">Aucune donnée disponible</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HourlyTrafficChart; 