import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyClientData {
    date: string;
    total: number;
    served: number;
    canceled?: number;
    noShow?: number;
}

interface DailyClientsChartProps {
    data: DailyClientData[];
    title?: string;
    description?: string;
}

const DailyClientsChart: React.FC<DailyClientsChartProps> = ({
    data,
    title = "Fréquentation",
    description = "Nombre de clients par jour"
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
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => [`${value} clients`, '']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="total" name="Total clients" fill="#8884d8" />
                            <Bar dataKey="served" name="Clients servis" fill="#82ca9d" />
                            {data[0]?.canceled !== undefined && (
                                <Bar dataKey="canceled" name="Clients annulés" fill="#e08283" />
                            )}
                            {data[0]?.noShow !== undefined && (
                                <Bar dataKey="noShow" name="No-show" fill="#ffc658" />
                            )}
                        </BarChart>
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

export default DailyClientsChart; 