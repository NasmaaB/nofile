'use client';

import React, { useState, useEffect } from 'react';
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
    Trash2,
    CreditCard,
    ArrowRight,
    Settings,
    Clock,
    Star
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { Toggle } from '@/components/ui/toggle';
import { useSubscription } from '@/hooks/use-subscription';
import { formatDate } from '@/lib/utils';

// Type étendu pour les paramètres utilisateur
interface ExtendedUserSettings {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
    };
    phone?: string;
    organization?: string;
}

// Étendre le type AuthUser pour inclure les paramètres supplémentaires
declare module '@/context/auth-context' {
    interface AuthUser {
        settings?: ExtendedUserSettings;
    }
}

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
    const { currentTier, currentLimits, prices, hasActiveSubscription } = useSubscription();
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [expirationDate, setExpirationDate] = useState<string | null>(null);

    // Accéder aux paramètres étendus
    const userSettings = user?.settings as ExtendedUserSettings;

    // Paramètres de notification
    const [notifications, setNotifications] = useState({
        email: userSettings?.notifications?.email || false,
        push: userSettings?.notifications?.push || false,
        sms: userSettings?.notifications?.sms || false
    });

    // Récupérer la date d'expiration simulée
    useEffect(() => {
        if (hasActiveSubscription) {
            // Simuler une date d'expiration pour la démo
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            setExpirationDate(formatDate(futureDate, "dd MMMM yyyy"));
        } else {
            setExpirationDate(null);
        }
    }, [hasActiveSubscription]);

    // Détection de la taille d'écran
    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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
            phone: userSettings?.phone || '',
            organization: userSettings?.organization || ''
        }
    });

    // Enregistrer les modifications du profil
    const onSubmit = async (data: ProfileFormValues) => {
        setSaving(true);
        setSuccess(false);

        try {
            const updatedSettings: ExtendedUserSettings = {
                theme: userSettings?.theme,
                notifications,
                phone: data.phone,
                organization: data.organization
            };

            await updateUserProfile({
                displayName: data.displayName,
                settings: updatedSettings
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

    // Convertir l'affichage du plan d'abonnement en français
    const getSubscriptionLabel = (tier: string): string => {
        switch (tier) {
            case 'free': return 'Gratuit';
            case 'basic': return 'Basique';
            case 'premium': return 'Premium';
            default: return 'Inconnu';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 pb-8">
            <h1 className="text-xl sm:text-2xl font-bold">Paramètres</h1>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-4 sm:space-y-6"
            >
                {/* Profil */}
                <motion.div variants={itemVariants}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Card>
                            <CardHeader className="py-4 px-4 sm:px-6">
                                <CardTitle className="flex items-center text-base sm:text-lg">
                                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                                    Informations du profil
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Mettez à jour vos informations personnelles
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 px-4 sm:px-6 py-0">
                                {/* Message de succès */}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-green-500/10 text-green-600 p-3 rounded-md flex items-start"
                                    >
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs sm:text-sm">Vos paramètres ont été enregistrés avec succès.</p>
                                    </motion.div>
                                )}

                                {/* Message d'erreur */}
                                {authError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start"
                                    >
                                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs sm:text-sm">{authError}</p>
                                    </motion.div>
                                )}

                                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                                    <div>
                                        <Input
                                            {...register('displayName')}
                                            placeholder="Nom complet"
                                            icon={<User className="h-4 w-4" />}
                                            error={errors.displayName?.message}
                                            className="h-9 sm:h-10"
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
                                            className="h-9 sm:h-10"
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
                                            className="h-9 sm:h-10"
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            {...register('organization')}
                                            placeholder="Organisation"
                                            icon={<Globe className="h-4 w-4" />}
                                            error={errors.organization?.message}
                                            className="h-9 sm:h-10"
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end py-4 px-4 sm:px-6">
                                <Button
                                    type="submit"
                                    size={isSmallScreen ? "sm" : "default"}
                                    className={isSmallScreen ? "h-8 text-xs" : ""}
                                    disabled={saving}
                                >
                                    {saving && (
                                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    <Save className="h-4 w-4 mr-2" />
                                    Enregistrer
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </motion.div>

                {/* Abonnement */}
                <motion.div variants={itemVariants}>
                    <Card className="pb-4">
                        <CardHeader className="py-4 px-4 sm:px-6">
                            <CardTitle className="flex items-center text-base sm:text-lg">
                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                                Abonnement
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Informations sur votre abonnement actuel
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 px-4 sm:px-6 py-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-3 rounded-lg">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                                        {currentTier === 'premium' ? (
                                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm sm:text-base">
                                            Plan {getSubscriptionLabel(currentTier)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {currentTier === 'free' ? 'Gratuit' : `${prices[currentTier]}€/mois`}
                                        </p>
                                        {expirationDate && (
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <Clock className="h-3 w-3 mr-1 inline" />
                                                Expire le {expirationDate}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                    className={isSmallScreen ? "h-8 text-xs w-full sm:w-auto" : ""}
                                    onClick={() => window.location.href = '/dashboard/subscription'}
                                >
                                    {hasActiveSubscription ? "Gérer l'abonnement" : "Mettre à niveau"}
                                    <ArrowRight className="h-3 w-3 ml-2" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                                <div className="border rounded-md p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Files d'attente</p>
                                    <p className="font-medium text-sm">
                                        {currentLimits.maxQueues === Infinity ? 'Illimitées' : currentLimits.maxQueues}
                                    </p>
                                </div>
                                <div className="border rounded-md p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Clients par jour</p>
                                    <p className="font-medium text-sm">
                                        {currentLimits.maxClientsPerDay === Infinity ? 'Illimités' : currentLimits.maxClientsPerDay}
                                    </p>
                                </div>
                                <div className="border rounded-md p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Utilisateurs</p>
                                    <p className="font-medium text-sm">
                                        {currentLimits.maxUsers === Infinity ? 'Illimités' : currentLimits.maxUsers}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardContent className="flex items-center justify-center py-8 px-4 sm:px-6">
                            <div className="text-center">
                                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm sm:text-base font-medium mb-1">Plus de paramètres à venir</p>
                                <p className="text-xs text-muted-foreground">De nouvelles fonctionnalités seront bientôt disponibles</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                {/* Notifications */}
                {/* <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="py-4 px-4 sm:px-6">
                            <CardTitle className="flex items-center text-base sm:text-lg">
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                                Préférences de notification
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Personnalisez la façon dont vous souhaitez être notifié
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 px-4 sm:px-6 py-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Notifications par email</p>
                                        <p className="text-xs text-muted-foreground">Recevoir des notifications par email</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={notifications.email}
                                    onPressedChange={() => handleNotificationToggle('email')}
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Notifications push</p>
                                        <p className="text-xs text-muted-foreground">Recevoir des notifications dans l'application</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={notifications.push}
                                    onPressedChange={() => handleNotificationToggle('push')}
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Notifications SMS</p>
                                        <p className="text-xs text-muted-foreground">Recevoir des notifications par SMS</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={notifications.sms}
                                    onPressedChange={() => handleNotificationToggle('sms')}
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end py-4 px-4 sm:px-6">
                            <Button
                                onClick={handleSubmit(onSubmit)}
                                size={isSmallScreen ? "sm" : "default"}
                                className={isSmallScreen ? "h-8 text-xs" : ""}
                                disabled={saving}
                            >
                                {saving && (
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="py-4 px-4 sm:px-6">
                            <CardTitle className="flex items-center text-base sm:text-lg">
                                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                                Préférences d'interface
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Personnalisez votre interface utilisateur
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 px-4 sm:px-6 py-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-muted-foreground">🌙</span>
                                    <div>
                                        <p className="text-sm font-medium">Mode sombre</p>
                                        <p className="text-xs text-muted-foreground">Activer le thème sombre</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={false}
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-muted-foreground">🔔</span>
                                    <div>
                                        <p className="text-sm font-medium">Sons de notification</p>
                                        <p className="text-xs text-muted-foreground">Activer les sons de notification</p>
                                    </div>
                                </div>
                                <Toggle
                                    pressed={true}
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="py-4 px-4 sm:px-6">
                            <CardTitle className="flex items-center text-base sm:text-lg">
                                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                                Sécurité
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Gérez les paramètres de sécurité de votre compte
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-4 sm:px-6 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Key className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Mot de passe</p>
                                        <p className="text-xs text-muted-foreground">Modifiez votre mot de passe</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size={isSmallScreen ? "sm" : "default"}
                                    className={isSmallScreen ? "h-8 text-xs" : ""}
                                >
                                    Modifier
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div> */}

                {/* Danger Zone */}
                <motion.div variants={itemVariants}>
                    <Card className="border-destructive/30">
                        <CardHeader className="py-4 px-4 sm:px-6">
                            <CardTitle className="flex items-center text-destructive text-base sm:text-lg">
                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Zone de danger
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Actions irréversibles pour votre compte
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-4 sm:px-6 py-3">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <p className="text-sm font-medium">Supprimer le compte</p>
                                    <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
                                </div>
                                <Button
                                    variant={deleteConfirm ? 'destructive' : 'outline'}
                                    size={isSmallScreen ? "sm" : "default"}
                                    className={isSmallScreen ? "h-8 text-xs" : ""}
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
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deleteConfirm ? 'Confirmer' : (isSmallScreen ? 'Supprimer' : 'Supprimer le compte')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}