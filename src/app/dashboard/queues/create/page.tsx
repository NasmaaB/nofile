'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Save,
    Trash,
    QrCode,
    Clock,
    BellRing,
    ListChecks,
    Users,
    AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueue } from '@/context/queue-context';
import { useAuth } from '@/context/auth-context';

// Validation schema
const queueSchema = z.object({
    name: z.string().min(3, { message: 'Le nom doit contenir au moins 3 caractères' }),
    description: z.string().optional(),
    averageServiceTime: z.coerce.number().min(1, { message: 'Le temps doit être au moins 1 minute' }).max(60, { message: 'Le temps doit être au maximum 60 minutes' }),
    maxClients: z.coerce.number().min(5, { message: 'Le minimum est 5 clients' }).max(500, { message: 'Le maximum est 500 clients' }),
    tokenPrefix: z.string().optional()
});

type QueueFormValues = z.infer<typeof queueSchema>;

export default function CreateQueuePage() {
    const router = useRouter();
    const { createQueue } = useQueue();
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Déterminer la limite max selon l'abonnement
    const maxClientsLimit = {
        free: 50,
        basic: 200,
        premium: 500
    }[user?.subscription as 'free' | 'basic' | 'premium'] || 50;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<QueueFormValues>({
        resolver: zodResolver(queueSchema),
        defaultValues: {
            name: '',
            description: '',
            averageServiceTime: 5,
            maxClients: maxClientsLimit,
            tokenPrefix: ''
        }
    });

    const watchTokenPrefix = watch('tokenPrefix', '');
    const watchName = watch('name', '');

    const onSubmit = async (data: QueueFormValues) => {
        setLoading(true);
        setError(null);

        try {
            // Créer la file d'attente
            const queueId = await createQueue({
                name: data.name,
                description: data.description || '',
                averageServiceTime: data.averageServiceTime,
                maxClients: data.maxClients,
                settings: {
                    tokenPrefix: data.tokenPrefix,
                    allowSelfRegistration: true,
                    requireClientPhone: true,
                    requireClientEmail: false,
                    notifyNextClientInAdvance: true,
                    notifyAdvanceCount: 2,
                    notificationType: ['sms'],
                    autoIncrementToken: true,
                    displayEstimatedWaitTime: true
                }
            });

            // Rediriger vers la page de détails de la file
            router.push(`/dashboard/queues/${queueId}`);
        } catch (err: any) {
            console.error('Erreur lors de la création de la file d\'attente:', err);
            setError(err.message || 'Une erreur s\'est produite lors de la création de la file d\'attente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Créer une nouvelle file d'attente</CardTitle>
                        <CardDescription>
                            Configurez les paramètres de base de votre file d'attente. Vous pourrez personnaliser davantage les paramètres après la création.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            {/* Erreur */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start"
                                >
                                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </motion.div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Informations générales */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium flex items-center">
                                        <ListChecks className="h-5 w-5 mr-2 text-primary" />
                                        Informations générales
                                    </h3>

                                    <div>
                                        <Input
                                            {...register('name')}
                                            placeholder="Nom de la file d'attente"
                                            error={errors.name?.message}
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            {...register('description')}
                                            placeholder="Description (optionnel)"
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            {...register('tokenPrefix')}
                                            placeholder="Préfixe des numéros (optionnel, ex: A-, B-)"
                                        />

                                        <div className="mt-2 text-sm text-muted-foreground">
                                            <p>Exemple de numéro: <span className="font-medium">{watchTokenPrefix || 'A-'}1</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Paramètres de service */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-primary" />
                                        Paramètres de service
                                    </h3>

                                    <div>
                                        <label className="text-sm font-medium mb-1 block">
                                            Temps de service moyen (minutes)
                                        </label>
                                        <Input
                                            type="number"
                                            {...register('averageServiceTime')}
                                            error={errors.averageServiceTime?.message}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Le temps moyen estimé pour servir un client
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-1 block">
                                            Nombre maximum de clients par jour
                                        </label>
                                        <Input
                                            type="number"
                                            {...register('maxClients')}
                                            error={errors.maxClients?.message}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Limité à {maxClientsLimit} clients avec votre abonnement actuel
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Aperçu */}
                            <div className="bg-accent/10 rounded-lg p-4 mt-6">
                                <h3 className="text-lg font-medium flex items-center mb-4">
                                    <QrCode className="h-5 w-5 mr-2 text-accent" />
                                    Aperçu de la file d'attente
                                </h3>

                                <div className="rounded-md border bg-card p-4">
                                    <div className="flex items-center justify-between border-b pb-3 mb-3">
                                        <div>
                                            <h4 className="font-medium">
                                                {watchName || 'Nouvelle file d\'attente'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {`QR Code d'inscription disponible après la création`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Clients en attente</div>
                                                <div className="text-lg font-semibold">0</div>
                                            </div>
                                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Temps moyen</div>
                                            <div className="font-medium">{watch('averageServiceTime') || 5} min</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Notifications</div>
                                            <div className="font-medium">SMS activées</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Format ticket</div>
                                            <div className="font-medium">{watchTokenPrefix || 'A-'}1, {watchTokenPrefix || 'A-'}2...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fonctionnalités */}
                            <div className="grid md:grid-cols-3 gap-4 mt-6">
                                <div className="rounded-lg border p-4 flex flex-col items-center text-center">
                                    <BellRing className="h-10 w-10 text-primary/70 mb-2" />
                                    <h3 className="font-medium mb-1">Notifications SMS</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Alerte automatique lorsque le tour du client approche
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4 flex flex-col items-center text-center">
                                    <QrCode className="h-10 w-10 text-primary/70 mb-2" />
                                    <h3 className="font-medium mb-1">QR Code d'inscription</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Permet aux clients de s'inscrire sans contact
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4 flex flex-col items-center text-center">
                                    <Clock className="h-10 w-10 text-primary/70 mb-2" />
                                    <h3 className="font-medium mb-1">Temps d'attente estimé</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Calcul et affichage du temps d'attente pour chaque client
                                    </p>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                leftIcon={<Trash className="h-4 w-4" />}
                            >
                                Annuler
                            </Button>

                            <Button
                                type="submit"
                                isLoading={loading}
                                leftIcon={<Save className="h-4 w-4" />}
                                variant="gradient"
                                animation="glow"
                            >
                                Créer la file d'attente
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}