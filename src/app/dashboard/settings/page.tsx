'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    User,
    Mail,
    Phone,
    Globe,
    Bell,
    Shield,
    Key,
    Save,
    AlertCircle,
    CheckCircle,
    Trash2
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { Toggle } from '@/components/ui/toggle';

// Schéma de validation des paramètres de profil
const profileSchema = z.object({
    displayName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
    email: z.string().email({ message: 'Email invalide' }),
    phone: z.string().optional(),
    organization: z.string().optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
    const { user, updateUserProfile, error: authError } = useAuth();
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Paramètres de notification
    const [notifications, setNotifications] = useState({
        email: user?.settings?.notifications?.email || false,
        push: user?.settings?.notifications?.push || false,
        sms: user?.settings?.notifications?.sms || false
    });

    // Initialiser le formulaire avec les valeurs actuelles
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: user?.displayName || '',
            email: user?.email || '',
            phone: user?.phoneNumber || '',
            organization: user?.organization || ''
        }
    });

    // Enregistrer les modifications du profil
    const onSubmit = async (data: ProfileFormValues) => {
        setSaving(true);
        setSuccess(false);

        try {
            await updateUserProfile({
                displayName: data.displayName,
                phoneNumber: data.phone,
                organization: data.organization,
                settings: {
                    ...user?.settings,
                    notifications
                }
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Erreur lors de la mise à jour du profil:', err);
        } finally {
            setSaving(false);
        }
    };

    // Gérer les changements de paramètres de notification
    const handleNotificationToggle = (type: 'email' | 'push' | 'sms') => {
        setNotifications(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    // Animations des sections
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Paramètres</h1>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-6"
            >
                {/* Profil */}
                <motion.div variants={itemVariants}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="h-5 w-5 mr-2 text-primary" />
                                    Informations du profil
                                </CardTitle>
                                <CardDescription>
                                    Mettez à jour vos informations personnelles
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Message de succès */}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-green-500/10 text-green-600 p-3 rounded-md flex items-start"
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                        <p>Vos paramètres ont été enregistrés avec succès.</p>
                                    </motion.div>
                                )}

                                {/* Message d'erreur */}
                                {authError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start"
                                    >
                                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                        <p>{authError}</p>
                                    </motion.div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Input
                                            {...register('displayName')}
                                            placeholder="Nom complet"
                                            icon={<User className="h-4 w-4" />}
                                            error={errors.displayName?.message}
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            {...register('email')}
                                            type="email"
                                            placeholder="Email"
                                            icon={<Mail className="h-4 w-4" />}
                                            error={errors.email?.message}
                                            disabled
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            L'email ne peut pas être modifié directement
                                        </p>
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
                                            {...register('organization')}
                                            placeholder="Organisation"
                                            icon={<Globe className="h-4 w-4" />}
                                            error={errors.organization?.message}
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end">
                                <Button
                                    type="submit"
                                    isLoading={saving}
                                    leftIcon={<Save className="h-4 w-4" />}
                                >
                                    Enregistrer
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </motion.div>

                {/* Notifications */}
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Bell className="h-5 w-5 mr-2 text-primary" />
                                Préférences de notification
                            </CardTitle>
                            <CardDescription>
                                Personnalisez la façon dont vous souhaitez être notifié
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Notifications par email</p>
                                        <p className="text-xs text-muted-foreground">Recevoir des notifications par email</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={notifications.email}
                                    onPressedChange={() => handleNotificationToggle('email')}
                                    variant="outline"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Notifications push</p>
                                        <p className="text-xs text-muted-foreground">Recevoir des notifications dans l'application</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={notifications.push}
                                    onPressedChange={() => handleNotificationToggle('push')}
                                    variant="outline"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Notifications SMS</p>
                                        <p className="text-xs text-muted-foreground">Recevoir des notifications par SMS</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={notifications.sms}
                                    onPressedChange={() => handleNotificationToggle('sms')}
                                    variant="outline"
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={handleSubmit(onSubmit)}
                                isLoading={saving}
                                leftIcon={<Save className="h-4 w-4" />}
                            >
                                Enregistrer
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Sécurité */}
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-primary" />
                                Sécurité
                            </CardTitle>
                            <CardDescription>
                                Gérez les paramètres de sécurité de votre compte
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Key className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Mot de passe</p>
                                        <p className="text-xs text-muted-foreground">Modifiez votre mot de passe</p>
                                    </div>
                                </div>
                                <Button variant="outline">
                                    Modifier
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Danger Zone */}
                <motion.div variants={itemVariants}>
                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="flex items-center text-destructive">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                Zone de danger
                            </CardTitle>
                            <CardDescription>
                                Actions irréversibles pour votre compte
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Supprimer le compte</p>
                                    <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
                                </div>
                                <Button
                                    variant={deleteConfirm ? 'destructive' : 'outline'}
                                    leftIcon={<Trash2 className="h-4 w-4" />}
                                    onClick={() => {
                                        if (deleteConfirm) {
                                            // Logique de suppression du compte
                                            console.log('Supprimer le compte');
                                        } else {
                                            setDeleteConfirm(true);
                                            setTimeout(() => setDeleteConfirm(false), 3000);
                                        }
                                    }}
                                >
                                    {deleteConfirm ? 'Confirmer la suppression' : 'Supprimer le compte'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}