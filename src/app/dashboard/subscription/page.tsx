'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    CheckCircle,
    Clock,
    Star,
    ArrowRight,
    AlertCircle,
    Check,
    X
} from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import LoadingSpinner from '@/components/common/loading-spinner';
import { formatDate } from '@/lib/utils';
import { SUBSCRIPTION_TIERS, FEATURES } from '@/lib/constants';

export default function SubscriptionPage() {
    const { user } = useAuth();
    const { currentTier, prices, updateSubscription } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Gérer la mise à niveau de l'abonnement
    const handleUpgrade = async (tier: 'free' | 'basic' | 'premium') => {
        setLoading(true);
        setUpgrading(tier);
        setError(null);
        setSuccess(null);

        try {
            await updateSubscription(tier);
            setSuccess(`Votre abonnement a été mis à jour avec succès vers ${tier === 'free' ? 'Gratuit' : tier === 'basic' ? 'Basique' : 'Premium'}`);
        } catch (err: any) {
            setError(err.message || 'Une erreur s\'est produite lors de la mise à jour de l\'abonnement');
        } finally {
            setLoading(false);
            setUpgrading(null);
        }
    };

    // Animation des cartes
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

    if (loading && !upgrading) {
        return <LoadingSpinner text="Chargement des informations d'abonnement..." />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Abonnement</h1>

            {/* Abonnement actuel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-primary" />
                            Votre abonnement actuel
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                                {currentTier === 'premium' ? (
                                    <Star className="h-6 w-6 text-primary" />
                                ) : (
                                    <CheckCircle className="h-6 w-6 text-primary" />
                                )}
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold">
                                    {currentTier === 'free' ? 'Gratuit' : currentTier === 'basic' ? 'Basique' : 'Premium'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {prices[currentTier as 'free' | 'basic' | 'premium']}€/mois
                                </p>
                            </div>
                        </div>

                        {user?.subscriptionExpiresAt && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                {currentTier === 'free'
                                    ? 'Sans date d\'expiration'
                                    : `Expire le ${formatDate(user.subscriptionExpiresAt, 'dd MMMM yyyy')}`
                                }
                            </div>
                        )}

                        {/* Message d'erreur */}
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Message de succès */}
                        {success && (
                            <div className="bg-green-500/10 text-green-600 p-3 rounded-md flex items-start">
                                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <p>{success}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Plans d'abonnement */}
            <h2 className="text-xl font-semibold mt-8">Choisissez votre plan</h2>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid md:grid-cols-3 gap-6 mt-4"
            >
                {/* Plan Gratuit */}
                <motion.div variants={itemVariants}>
                    <Card className={`h-full flex flex-col ${currentTier === 'free' ? 'border-primary/50 bg-primary/5' : ''}`}>
                        <CardHeader>
                            <CardTitle>Gratuit</CardTitle>
                            <div className="mt-2">
                                <span className="text-3xl font-bold">0€</span>
                                <span className="text-muted-foreground">/mois</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Parfait pour démarrer et découvrir NoFile
                            </p>
                        </CardHeader>

                        <CardContent className="flex-grow">
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>1 file d'attente active</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>20 clients par jour</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Fonctionnalités de base</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>1 utilisateur</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">Notifications SMS</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">Statistiques avancées</span>
                                </li>
                            </ul>
                        </CardContent>

                        <CardFooter>
                            <Button
                                variant={currentTier === 'free' ? 'secondary' : 'outline'}
                                className="w-full"
                                disabled={currentTier === 'free' || loading}
                                onClick={() => handleUpgrade('free')}
                                isLoading={upgrading === 'free'}
                            >
                                {currentTier === 'free' ? 'Plan actuel' : 'Rétrograder'}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Plan Basique */}
                <motion.div variants={itemVariants}>
                    <Card className={`h-full flex flex-col relative overflow-hidden ${currentTier === 'basic' ? 'border-primary/50 bg-primary/5' : ''}`}>
                        {/* Badge populaire */}
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-bl-lg">
                            Le plus populaire
                        </div>

                        <CardHeader>
                            <CardTitle>Basique</CardTitle>
                            <div className="mt-2">
                                <span className="text-3xl font-bold">29€</span>
                                <span className="text-muted-foreground">/mois</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Idéal pour les petites entreprises
                            </p>
                        </CardHeader>

                        <CardContent className="flex-grow">
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>3 files d'attente actives</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>100 clients par jour</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Notifications SMS incluses</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Statistiques basiques</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>3 utilisateurs</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Support par email</span>
                                </li>
                            </ul>
                        </CardContent>

                        <CardFooter>
                            <Button
                                variant={currentTier === 'basic' ? 'secondary' : 'gradient'}
                                animation={currentTier !== 'basic' ? 'glow' : undefined}
                                className="w-full"
                                disabled={currentTier === 'basic' || loading}
                                onClick={() => handleUpgrade('basic')}
                                isLoading={upgrading === 'basic'}
                            >
                                {currentTier === 'basic' ? 'Plan actuel' : currentTier === 'premium' ? 'Rétrograder' : 'Mettre à niveau'}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Plan Premium */}
                <motion.div variants={itemVariants}>
                    <Card className={`h-full flex flex-col ${currentTier === 'premium' ? 'border-primary/50 bg-primary/5' : ''}`}>
                        <CardHeader>
                            <CardTitle>Premium</CardTitle>
                            <div className="mt-2">
                                <span className="text-3xl font-bold">89€</span>
                                <span className="text-muted-foreground">/mois</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Pour les grandes structures et entreprises
                            </p>
                        </CardHeader>

                        <CardContent className="flex-grow">
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Files d'attente illimitées</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Clients illimités</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>SMS illimités</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Statistiques avancées</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Utilisateurs illimités</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Support prioritaire</span>
                                </li>
                            </ul>
                        </CardContent>

                        <CardFooter>
                            <Button
                                variant={currentTier === 'premium' ? 'secondary' : 'gradient'}
                                animation={currentTier !== 'premium' ? 'glow' : undefined}
                                className="w-full"
                                disabled={currentTier === 'premium' || loading}
                                onClick={() => handleUpgrade('premium')}
                                isLoading={upgrading === 'premium'}
                                rightIcon={currentTier !== 'premium' ? <ArrowRight className="h-4 w-4" /> : undefined}
                            >
                                {currentTier === 'premium' ? 'Plan actuel' : 'Mettre à niveau'}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Tableau comparatif des fonctionnalités */}
            <h2 className="text-xl font-semibold mt-8">Comparaison des fonctionnalités</h2>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-4 overflow-x-auto"
            >
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="py-3 px-4 text-left font-medium">Fonctionnalité</th>
                            <th className="py-3 px-4 text-center font-medium">Gratuit</th>
                            <th className="py-3 px-4 text-center font-medium">Basique</th>
                            <th className="py-3 px-4 text-center font-medium">Premium</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="py-3 px-4">Files d'attente</td>
                            <td className="py-3 px-4 text-center">1</td>
                            <td className="py-3 px-4 text-center">3</td>
                            <td className="py-3 px-4 text-center">Illimité</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Clients par jour</td>
                            <td className="py-3 px-4 text-center">20</td>
                            <td className="py-3 px-4 text-center">100</td>
                            <td className="py-3 px-4 text-center">Illimité</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Notifications SMS</td>
                            <td className="py-3 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Statistiques avancées</td>
                            <td className="py-3 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">QR Codes personnalisés</td>
                            <td className="py-3 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Utilisateurs</td>
                            <td className="py-3 px-4 text-center">1</td>
                            <td className="py-3 px-4 text-center">3</td>
                            <td className="py-3 px-4 text-center">Illimité</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Support</td>
                            <td className="py-3 px-4 text-center">Email</td>
                            <td className="py-3 px-4 text-center">Email</td>
                            <td className="py-3 px-4 text-center">Prioritaire</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Exports de données</td>
                            <td className="py-3 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 px-4">Intégration API</td>
                            <td className="py-3 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                            <td className="py-3 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        </tr>
                    </tbody>
                </table>
            </motion.div>

            {/* FAQ */}
            <h2 className="text-xl font-semibold mt-8">Questions fréquentes</h2>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="space-y-4 mt-4"
            >
                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Puis-je changer de forfait à tout moment ?</h3>
                    <p className="text-muted-foreground">Oui, vous pouvez mettre à niveau ou rétrograder votre abonnement à tout moment. Les modifications prendront effet immédiatement.</p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Comment fonctionne la facturation ?</h3>
                    <p className="text-muted-foreground">La facturation est mensuelle. Vous serez facturé le jour de votre inscription et ensuite tous les mois à la même date.</p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Y a-t-il une période d'essai ?</h3>
                    <p className="text-muted-foreground">Oui, nous offrons une période d'essai de 14 jours pour les forfaits Basique et Premium. Vous pouvez annuler à tout moment pendant cette période sans être facturé.</p>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Comment puis-je annuler mon abonnement ?</h3>
                    <p className="text-muted-foreground">Vous pouvez annuler votre abonnement à tout moment en revenant sur cette page et en passant au forfait Gratuit. Votre abonnement restera actif jusqu'à la fin de la période de facturation en cours.</p>
                </div>
            </motion.div>
        </div>
    );
}