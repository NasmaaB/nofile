'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler, FieldValues } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useQueue } from '@/context/queue-context';
import { Switch } from '@/components/ui/switch';
import { type Queue } from '@/types';

// Schéma de validation pour le formulaire
const queueFormSchema = z.object({
    name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères' }).max(50, { message: 'Le nom ne doit pas dépasser 50 caractères' }),
    description: z.string().max(200, { message: 'La description ne doit pas dépasser 200 caractères' }).optional(),
    maxClients: z.coerce.number().min(1, { message: 'Le nombre maximum de clients doit être au moins 1' }).max(1000, { message: 'Le nombre maximum de clients ne peut pas dépasser 1000' }),
    averageServiceTime: z.coerce.number().min(1, { message: 'Le temps moyen de service doit être au moins 1 minute' }).max(60, { message: 'Le temps moyen de service ne peut pas dépasser 60 minutes' }),
    isActive: z.boolean().default(true),
    allowSelfRegistration: z.boolean().default(true),
    displayEstimatedWaitTime: z.boolean().default(true),
    notifySMS: z.boolean().default(false),
    notifyEmail: z.boolean().default(false),
    activeServers: z.coerce.number().min(1, { message: 'Le nombre de serveurs actifs doit être au moins 1' }).max(20, { message: 'Le nombre de serveurs actifs ne peut pas dépasser 20' }),
});

type QueueFormValues = z.infer<typeof queueFormSchema>;

export default function EditQueuePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { getQueue, updateQueue } = useQueue();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Récupérer l'ID de la file depuis l'URL
    const queueId = Array.isArray(params.id) ? params.id[0] : params.id;

    // Configurer le formulaire avec le bon typage
    const form = useForm<QueueFormValues>({
        resolver: zodResolver(queueFormSchema) as any,
        defaultValues: {
            name: '',
            description: '',
            maxClients: 50,
            averageServiceTime: 5,
            isActive: true,
            allowSelfRegistration: true,
            displayEstimatedWaitTime: true,
            notifySMS: false,
            notifyEmail: false,
            activeServers: 1,
        },
    });

    // Charger les données de la file
    useEffect(() => {
        const fetchQueueData = async () => {
            if (!queueId) {
                setError("Identifiant de file d'attente invalide");
                setLoading(false);
                return;
            }

            try {
                const queue = await getQueue(queueId);

                if (queue) {
                    // Type assertion pour QueueWithServers
                    const queueWithSettings = queue as Queue & {
                        settings?: {
                            activeServers?: number;
                            allowSelfRegistration?: boolean;
                            displayEstimatedWaitTime?: boolean;
                            notificationType?: string[];
                        }
                    };

                    // Remplir le formulaire avec les données existantes
                    form.reset({
                        name: queueWithSettings.name || '',
                        description: queueWithSettings.description || '',
                        maxClients: queueWithSettings.maxClients || 50,
                        averageServiceTime: queueWithSettings.averageServiceTime || 5,
                        isActive: queueWithSettings.isActive !== false, // Valeur par défaut à true si undefined
                        allowSelfRegistration: queueWithSettings.settings?.allowSelfRegistration !== false, // Valeur par défaut à true si undefined
                        displayEstimatedWaitTime: queueWithSettings.settings?.displayEstimatedWaitTime !== false, // Valeur par défaut à true si undefined
                        notifySMS: queueWithSettings.settings?.notificationType?.includes('sms') || false,
                        notifyEmail: queueWithSettings.settings?.notificationType?.includes('email') || false,
                        activeServers: queueWithSettings.settings?.activeServers || 1,
                    });
                } else {
                    setError("File d'attente introuvable");
                }
            } catch (err) {
                console.error("Erreur lors du chargement de la file d'attente:", err);
                setError("Erreur lors du chargement des données de la file d'attente");
            } finally {
                setLoading(false);
            }
        };

        fetchQueueData();
    }, [queueId, getQueue, form]);

    // Soumettre le formulaire
    const onSubmit = (data: QueueFormValues) => {
        if (!queueId) return;

        setSaving(true);

        // Préparer les types de notification
        const notificationType: string[] = [];
        if (data.notifySMS) notificationType.push('sms');
        if (data.notifyEmail) notificationType.push('email');

        // Préparer l'objet settings
        const settings = {
            allowSelfRegistration: data.allowSelfRegistration,
            displayEstimatedWaitTime: data.displayEstimatedWaitTime,
            notificationType,
            activeServers: data.activeServers,
        };

        // Si la file est inactive, désactiver l'auto-inscription
        if (!data.isActive) {
            settings.allowSelfRegistration = false;
        }

        // Mettre à jour la file
        updateQueue(queueId, {
            name: data.name,
            description: data.description,
            maxClients: data.maxClients,
            averageServiceTime: data.averageServiceTime,
            isActive: data.isActive,
            settings,
        })
            .then(() => {
                toast({
                    title: "File d'attente mise à jour",
                    description: "Les modifications ont été enregistrées avec succès",
                    variant: "default",
                });

                // Rediriger vers la page de détails de la file
                router.push(`/dashboard/queues/${queueId}`);
            })
            .catch((err) => {
                console.error("Erreur lors de la mise à jour de la file d'attente:", err);
                toast({
                    title: "Erreur",
                    description: "Impossible de mettre à jour la file d'attente",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setSaving(false);
            });
    };

    // Afficher un message d'erreur
    if (error) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/queues')}
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux files d&apos;attente
                </Button>

                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">Erreur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/queues')}
                        >
                            Retour aux files d&apos;attente
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Afficher un indicateur de chargement
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Chargement des informations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/queues/${queueId}`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la file
                </Button>

                <Button
                    variant="default"
                    onClick={() => form.handleSubmit(onSubmit as any)()}
                    disabled={saving}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer les modifications
                        </>
                    )}
                </Button>
            </div>

            <h1 className="text-2xl font-bold mb-6">Modifier la file d&apos;attente</h1>

            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations générales</CardTitle>
                        <CardDescription>
                            Informations de base de votre file d&apos;attente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom de la file <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                {...form.register('name')}
                                placeholder="Saisir le nom de la file"
                                className={form.formState.errors.name ? "border-destructive" : ""}
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...form.register('description')}
                                placeholder="Saisir une description (facultatif)"
                                className={form.formState.errors.description ? "border-destructive" : ""}
                            />
                            {form.formState.errors.description && (
                                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Paramètres</CardTitle>
                        <CardDescription>
                            Configuration du fonctionnement de la file d&apos;attente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="maxClients">Nombre maximum de clients <span className="text-destructive">*</span></Label>
                                <Input
                                    id="maxClients"
                                    type="number"
                                    {...form.register('maxClients', { valueAsNumber: true })}
                                    min={1}
                                    max={1000}
                                    className={form.formState.errors.maxClients ? "border-destructive" : ""}
                                />
                                {form.formState.errors.maxClients && (
                                    <p className="text-sm text-destructive">{form.formState.errors.maxClients.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="averageServiceTime">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        Temps moyen par client (min)
                                    </span>
                                </Label>
                                <Input
                                    id="averageServiceTime"
                                    type="number"
                                    {...form.register('averageServiceTime', { valueAsNumber: true })}
                                    min={1}
                                    max={60}
                                    className={form.formState.errors.averageServiceTime ? "border-destructive" : ""}
                                />
                                {form.formState.errors.averageServiceTime && (
                                    <p className="text-sm text-destructive">{form.formState.errors.averageServiceTime.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="activeServers">Nombre de serveurs actifs</Label>
                                <Input
                                    id="activeServers"
                                    type="number"
                                    {...form.register('activeServers', { valueAsNumber: true })}
                                    min={1}
                                    max={20}
                                    className={form.formState.errors.activeServers ? "border-destructive" : ""}
                                />
                                {form.formState.errors.activeServers && (
                                    <p className="text-sm text-destructive">{form.formState.errors.activeServers.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Nombre de personnes servant les clients simultanément
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive">État de la file</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Activer ou désactiver la file d&apos;attente
                                    </p>
                                </div>
                                <Switch
                                    id="isActive"
                                    checked={form.watch('isActive')}
                                    onCheckedChange={(checked) => {
                                        form.setValue('isActive', checked);
                                        // Si on désactive la file, désactiver aussi l'auto-inscription
                                        if (!checked) {
                                            form.setValue('allowSelfRegistration', false);
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="allowSelfRegistration">Auto-inscription</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {!form.watch('isActive') ? (
                                            <span className="text-yellow-500">
                                                Nécessite que la file soit active
                                            </span>
                                        ) : (
                                            "Autoriser les clients à s'inscrire eux-mêmes"
                                        )}
                                    </p>
                                </div>
                                <Switch
                                    id="allowSelfRegistration"
                                    checked={form.watch('allowSelfRegistration')}
                                    onCheckedChange={(checked) => form.setValue('allowSelfRegistration', checked)}
                                    disabled={!form.watch('isActive')}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="displayEstimatedWaitTime">Afficher le temps d&apos;attente</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Montrer le temps d&apos;attente estimé aux clients
                                    </p>
                                </div>
                                <Switch
                                    id="displayEstimatedWaitTime"
                                    checked={form.watch('displayEstimatedWaitTime')}
                                    onCheckedChange={(checked) => form.setValue('displayEstimatedWaitTime', checked)}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-sm font-medium mb-2">Notifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="notifySMS">Notifications SMS</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Permettre les notifications par SMS
                                        </p>
                                    </div>
                                    <Switch
                                        id="notifySMS"
                                        checked={form.watch('notifySMS')}
                                        onCheckedChange={(checked) => form.setValue('notifySMS', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="notifyEmail">Notifications Email</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Permettre les notifications par email
                                        </p>
                                    </div>
                                    <Switch
                                        id="notifyEmail"
                                        checked={form.watch('notifyEmail')}
                                        onCheckedChange={(checked) => form.setValue('notifyEmail', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        variant="default"
                        disabled={saving}
                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full sm:w-auto"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer les modifications
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
} 