import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Phone, Mail, FileText, Save, ArrowLeft, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueue } from '@/context/queue-context';
import { useClients } from '@/hooks/use-clients';
import { formatPhoneNumber, isValidPhone } from '@/lib/utils';

// Validation schema
const clientSchema = z.object({
    name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
    phone: z.string().refine(val => val.length === 0 || isValidPhone(val), {
        message: 'Numéro de téléphone invalide'
    }),
    email: z.string().email({ message: 'Email invalide' }).optional().or(z.literal('')),
    notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
    queueId?: string;
    onSuccess?: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ queueId: propQueueId, onSuccess }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { queues, currentQueue, addClient } = useQueue();
    const { waitingClients } = useClients();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Récupérer l'ID de la file d'attente depuis les props ou les paramètres d'URL
    const urlQueueId = searchParams?.get('queueId');
    const queueId = propQueueId || urlQueueId || currentQueue?.id;

    // Trouver la file d'attente correspondante
    const queue = queues.find(q => q.id === queueId);

    // Obtenir le nombre de clients en attente pour cette file
    const queueWaitingClientsCount = waitingClients.filter(client => client.queueId === queueId).length;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            notes: ''
        }
    });

    // Formater automatiquement le numéro de téléphone pendant la saisie
    const phoneValue = watch('phone');
    useEffect(() => {
        if (phoneValue) {
            const formattedPhone = formatPhoneNumber(phoneValue);
            if (formattedPhone !== phoneValue) {
                setValue('phone', formattedPhone);
            }
        }
    }, [phoneValue, setValue]);

    const onSubmit = async (data: ClientFormValues) => {
        if (!queueId) {
            setError('Aucune file d\'attente sélectionnée');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Ajouter le client à la file d'attente
            await addClient({
                queueId,
                name: data.name,
                phone: data.phone,
                email: data.email || '',
                notes: data.notes || ''
            });

            // Appeler le callback de succès ou rediriger
            if (onSuccess) {
                onSuccess();
            } else {
                router.push(queue ? `/dashboard/queues/${queueId}` : '/dashboard/clients');
            }
        } catch (err: any) {
            console.error('Erreur lors de l\'ajout du client:', err);
            setError(err.message || 'Une erreur s\'est produite lors de l\'ajout du client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Ajouter un client</CardTitle>
                    <CardDescription>
                        {queue
                            ? `Ajouter un client à la file d'attente: ${queue.name}`
                            : 'Veuillez remplir les informations du client'}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
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

                        {/* Aucune file sélectionnée */}
                        {!queue && (
                            <div className="bg-yellow-500/10 text-yellow-600 p-4 rounded-md">
                                <p className="font-medium mb-1">Attention</p>
                                <p className="text-sm">
                                    Aucune file d'attente n'est sélectionnée. Le client sera ajouté à la file d'attente active.
                                </p>
                            </div>
                        )}

                        {/* Informations du client */}
                        <div className="space-y-4">
                            <div>
                                <Input
                                    {...register('name')}
                                    placeholder="Nom du client *"
                                    icon={<User className="h-4 w-4" />}
                                    error={errors.name?.message}
                                />
                            </div>

                            <div>
                                <Input
                                    {...register('phone')}
                                    placeholder="Téléphone"
                                    icon={<Phone className="h-4 w-4" />}
                                    error={errors.phone?.message}
                                />
                            </div>

                            <div>
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="Email"
                                    icon={<Mail className="h-4 w-4" />}
                                    error={errors.email?.message}
                                />
                            </div>

                            <div>
                                <Input
                                    {...register('notes')}
                                    placeholder="Notes (optionnel)"
                                    icon={<FileText className="h-4 w-4" />}
                                />
                            </div>
                        </div>

                        {/* Informations sur la file d'attente */}
                        {queue && (
                            <div className="bg-primary/5 p-4 rounded-lg">
                                <h3 className="font-medium mb-3">Informations sur la file</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">File d'attente</p>
                                        <p className="font-medium">{queue.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Clients en attente</p>
                                        <p className="font-medium">{queueWaitingClientsCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Temps d'attente moyen</p>
                                        <p className="font-medium">{queue.averageServiceTime || 0} min</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">État</p>
                                        <p className={`font-medium ${queue.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                            {queue.isActive ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            leftIcon={<ArrowLeft className="h-4 w-4" />}
                        >
                            Retour
                        </Button>

                        <Button
                            type="submit"
                            isLoading={loading}
                            leftIcon={<Save className="h-4 w-4" />}
                            variant="gradient"
                            animation="glow"
                        >
                            Ajouter le client
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
};

export default ClientForm;