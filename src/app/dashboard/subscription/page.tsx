"use client";

import React, { useState, useEffect, type ReactElement } from "react";
import { motion } from "framer-motion";
import {
    CreditCard,
    CheckCircle,
    Clock,
    Star,
    ArrowRight,
    AlertCircle,
    Check,
    X,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import LoadingSpinner from "@/components/common/loading-spinner";
import { formatDate } from "@/lib/utils";

// -----------------------------------------------------------------------------
// 💡  Si SUBSCRIPTION_TIERS ou FEATURES ne sont pas utilisés ailleurs dans ce
//     composant, commente‑les pour éviter l'« unused import » de TypeScript.
// -----------------------------------------------------------------------------
// import { SUBSCRIPTION_TIERS, FEATURES } from "@/lib/constants";

// --------------------------------------------------------
// Types utilitaires pour plus de lisibilité / sécurité TS
// --------------------------------------------------------
export type Tier = "free" | "basic" | "premium";

// --------------------------------------------------------
// Variantes d'animation Framer Motion (déclarées en dehors
// du composant pour éviter une recréation inutile)
// --------------------------------------------------------
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

// =============================================================================
// Composant principal
// =============================================================================
export default function SubscriptionPage(): ReactElement {
    const { user } = useAuth();
    const {
        currentTier,
        prices,
        updateSubscription,
        loading: subLoading
    } = useSubscription();

    // --------------------
    // State locaux UI
    // --------------------
    const [loading, setLoading] = useState(false); // loading spécifique à l'upgrade
    const [upgrading, setUpgrading] = useState<Tier | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showTable, setShowTable] = useState(false);
    const [showFAQ, setShowFAQ] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
    const [expirationDate, setExpirationDate] = useState<string | null>(null);

    // Récupérer la date d'expiration
    useEffect(() => {
        if (user && currentTier !== 'free') {
            // Simuler une date d'expiration pour la démo
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            setExpirationDate(formatDate(futureDate, "dd MMMM yyyy"));
        } else {
            setExpirationDate(null);
        }
    }, [user, currentTier]);

    // ---------------------------------------------------------------------------
    // ⚡ Détection de la taille d'écran
    // ---------------------------------------------------------------------------
    useEffect(() => {
        // Pas de window côté SSR, mais "use client" => OK. On garde la vérif par sûreté.
        const calcScreenSize = () => setIsSmallScreen(window.innerWidth < 768);

        calcScreenSize();
        window.addEventListener("resize", calcScreenSize);
        return () => window.removeEventListener("resize", calcScreenSize);
    }, []);

    // ---------------------------------------------------------------------------
    // 🪄  Gestion de la mise à niveau / rétrogradation
    // ---------------------------------------------------------------------------
    const handleUpgrade = async (tier: Tier) => {
        setLoading(true);
        setUpgrading(tier);
        setError(null);
        setSuccess(null);

        try {
            await updateSubscription(tier);
            const labelMap: Record<Tier, string> = {
                free: "Gratuit",
                basic: "Basique",
                premium: "Premium",
            };
            setSuccess(`Votre abonnement est passé avec succès au forfait ${labelMap[tier]} !`);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const e = err as { message?: string };
            setError(
                e?.message ?? "Une erreur s'est produite lors de la mise à jour de l'abonnement."
            );
        } finally {
            setLoading(false);
            setUpgrading(null);
        }
    };

    // ---------------------------------------------------------------------------
    // Affichage loading global (données d'abonnement en cours de chargement ET
    // aucune upgrade utilisateur en cours)
    // ---------------------------------------------------------------------------
    if (subLoading && !upgrading) {
        return <LoadingSpinner text="Chargement des informations d'abonnement …" />;
    }

    // ---------------------------------------------------------------------------
    // 💅  Helpers UI
    // ---------------------------------------------------------------------------
    const isCurrent = (tier: Tier) => currentTier === tier;
    const renderPrice = (tier: Tier) => (
        <>
            <span className="text-xl sm:text-2xl font-bold">
                {tier === "free" ? 0 : prices[tier]}
                €
            </span>
            <span className="text-muted-foreground text-xs">/mois</span>
        </>
    );

    // ---------------------------------------------------------------------------
    // 🖼️  Composant réutilisable pour un plan (mobile & desktop)
    // ---------------------------------------------------------------------------
    const PlanCard = ({
        tier,
        children,
        popular = false,
    }: {
        tier: Tier;
        children: React.ReactNode;
        popular?: boolean;
    }) => (
        <Card
            className={`relative overflow-hidden h-full flex flex-col ${isCurrent(tier) ? "border-primary/50 bg-primary/5" : ""
                }`}
        >
            {popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-bl-lg">
                    Le plus populaire
                </div>
            )}

            {children}
        </Card>
    );

    // =============================================================================
    // Rendu
    // =============================================================================
    return (
        <div className="space-y-4 px-2 sm:px-4 pb-10">
            <h1 className="text-lg sm:text-xl font-bold">Abonnement</h1>

            {/* -------------------------------------------------- */}
            {/* Abonnement actuel                                */}
            {/* -------------------------------------------------- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardHeader className="py-2 px-4">
                        <CardTitle className="flex items-center text-sm sm:text-base">
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                            Votre abonnement actuel
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 px-4 py-2">
                        {/* Titre & prix */}
                        <div className="flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3 sm:mr-4">
                                {currentTier === "premium" ? (
                                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                )}
                            </div>

                            <div>
                                <h3 className="text-base sm:text-lg font-semibold">
                                    {currentTier === "free"
                                        ? "Gratuit"
                                        : currentTier === "basic"
                                            ? "Basique"
                                            : "Premium"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {currentTier === "free" ? 0 : prices[currentTier]}€/mois
                                </p>
                            </div>
                        </div>

                        {/* Expiration */}
                        {expirationDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {currentTier === "free"
                                    ? "Sans date d'expiration"
                                    : `Expire le ${expirationDate}`}
                            </div>
                        )}

                        {/* Feedback ‑ error / success */}
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-2 rounded-md flex items-start">
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-xs">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 text-green-600 p-2 rounded-md flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-xs">{success}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* -------------------------------------------------- */}
            {/* Plans d'abonnement                               */}
            {/* -------------------------------------------------- */}
            <h2 className="text-base sm:text-lg font-semibold mt-6">Choisissez votre plan</h2>

            {/* -------------------------------------------------- */}
            {/* Version mobile (accordion)                       */}
            {/* -------------------------------------------------- */}
            {isSmallScreen ? (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-3 mt-3"
                >
                    {/* ---------- Plan Gratuit ---------- */}
                    <motion.div variants={itemVariants}>
                        <PlanCard tier="free">
                            <CardHeader className="py-2 px-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-sm">Gratuit</CardTitle>
                                        <div className="mt-1">{renderPrice("free")}</div>
                                    </div>
                                    <Button
                                        variant={isCurrent("free") ? "secondary" : "outline"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={isCurrent("free") || loading}
                                        onClick={() => handleUpgrade("free")}
                                    >
                                        {upgrading === "free" && (
                                            <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        )}
                                        {isCurrent("free") ? "Actuel" : "Choisir"}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="px-3 py-2">
                                <ul className="space-y-1.5 text-xs">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>1 file d'attente active</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>20 clients par jour</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <X className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">Notifications SMS</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </PlanCard>
                    </motion.div>

                    {/* ---------- Plan Basique ---------- */}
                    <motion.div variants={itemVariants}>
                        <PlanCard tier="basic" popular>
                            <CardHeader className="py-2 px-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-sm">Basique</CardTitle>
                                        <div className="mt-1">{renderPrice("basic")}</div>
                                    </div>
                                    <Button
                                        variant={isCurrent("basic") ? "secondary" : "default"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={isCurrent("basic") || loading}
                                        onClick={() => handleUpgrade("basic")}
                                    >
                                        {upgrading === "basic" && (
                                            <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        )}
                                        {isCurrent("basic") ? "Actuel" : "Choisir"}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="px-3 py-2">
                                <ul className="space-y-1.5 text-xs">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>3 files d'attente actives</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>100 clients par jour</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>Notifications SMS incluses</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </PlanCard>
                    </motion.div>

                    {/* ---------- Plan Premium ---------- */}
                    <motion.div variants={itemVariants}>
                        <PlanCard tier="premium">
                            <CardHeader className="py-2 px-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-sm">Premium</CardTitle>
                                        <div className="mt-1">{renderPrice("premium")}</div>
                                    </div>
                                    <Button
                                        variant={isCurrent("premium") ? "secondary" : "default"}
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={isCurrent("premium") || loading}
                                        onClick={() => handleUpgrade("premium")}
                                    >
                                        {upgrading === "premium" && (
                                            <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        )}
                                        {isCurrent("premium") ? "Actuel" : "Choisir"}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="px-3 py-2">
                                <ul className="space-y-1.5 text-xs">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>Files d'attente illimitées</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>Clients illimités</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>SMS illimités</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </PlanCard>
                    </motion.div>
                </motion.div>
            ) : (
                /* -------------------------------------------------- */
                /* Version desktop (grid)                             */
                /* -------------------------------------------------- */
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="grid md:grid-cols-3 gap-4 sm:gap-5 mt-3"
                >
                    {/* ---------- Plan Gratuit ---------- */}
                    <motion.div variants={itemVariants}>
                        <PlanCard tier="free">
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm sm:text-base">Gratuit</CardTitle>
                                <div className="mt-2 text-xl font-bold flex items-end gap-1">
                                    {renderPrice("free")}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Parfait pour découvrir NoFile
                                </p>
                            </CardHeader>

                            <CardContent className="flex-grow px-4 pb-4 pt-0">
                                <ul className="space-y-1.5">
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">1 file d'attente active</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">20 clients par jour</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Fonctionnalités de base</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">1 utilisateur</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm text-muted-foreground">Notifications SMS</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm text-muted-foreground">Statistiques avancées</span>
                                    </li>
                                </ul>
                            </CardContent>

                            <CardFooter className="px-4 py-3">
                                <Button
                                    variant={isCurrent("free") ? "secondary" : "outline"}
                                    className="w-full text-xs sm:text-sm h-8"
                                    disabled={isCurrent("free") || loading}
                                    onClick={() => handleUpgrade("free")}
                                >
                                    {upgrading === "free" && (
                                        <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    {isCurrent("free") ? "Plan actuel" : "Rétrograder"}
                                </Button>
                            </CardFooter>
                        </PlanCard>
                    </motion.div>

                    {/* ---------- Plan Basique ---------- */}
                    <motion.div variants={itemVariants}>
                        <PlanCard tier="basic" popular>
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm sm:text-base">Basique</CardTitle>
                                <div className="mt-2 text-xl font-bold flex items-end gap-1">
                                    {renderPrice("basic")}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Idéal pour les petites entreprises
                                </p>
                            </CardHeader>

                            <CardContent className="flex-grow px-4 pb-4 pt-0">
                                <ul className="space-y-1.5">
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">3 files d'attente actives</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">100 clients par jour</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Notifications SMS incluses</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Statistiques basiques</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">3 utilisateurs</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Support par email</span>
                                    </li>
                                </ul>
                            </CardContent>

                            <CardFooter className="px-4 py-3">
                                <Button
                                    variant={isCurrent("basic") ? "secondary" : "default"}
                                    className="w-full text-xs sm:text-sm h-8"
                                    disabled={isCurrent("basic") || loading}
                                    onClick={() => handleUpgrade("basic")}
                                >
                                    {upgrading === "basic" && (
                                        <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    {isCurrent("basic")
                                        ? "Plan actuel"
                                        : currentTier === "premium"
                                            ? "Rétrograder"
                                            : "Mettre à niveau"}
                                </Button>
                            </CardFooter>
                        </PlanCard>
                    </motion.div>

                    {/* ---------- Plan Premium ---------- */}
                    <motion.div variants={itemVariants}>
                        <PlanCard tier="premium">
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm sm:text-base">Premium</CardTitle>
                                <div className="mt-2 text-xl font-bold flex items-end gap-1">
                                    {renderPrice("premium")}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Pour les grandes structures et entreprises
                                </p>
                            </CardHeader>

                            <CardContent className="flex-grow px-4 pb-4 pt-0">
                                <ul className="space-y-1.5">
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Files d'attente illimitées</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Clients illimités</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">SMS illimités</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Statistiques avancées</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Utilisateurs illimités</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm">Support prioritaire</span>
                                    </li>
                                </ul>
                            </CardContent>

                            <CardFooter className="px-4 py-3">
                                <Button
                                    variant={isCurrent("premium") ? "secondary" : "default"}
                                    className="w-full text-xs sm:text-sm h-8"
                                    disabled={isCurrent("premium") || loading}
                                    onClick={() => handleUpgrade("premium")}
                                >
                                    {upgrading === "premium" && (
                                        <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    {isCurrent("premium") ? "Plan actuel" : "Mettre à niveau"}
                                    {!isCurrent("premium") && !upgrading && (
                                        <ArrowRight className="ml-1.5 h-3 w-3" />
                                    )}
                                </Button>
                            </CardFooter>
                        </PlanCard>
                    </motion.div>
                </motion.div>
            )}

            {/* -------------------------------------------------- */}
            {/* Tableau comparatif des fonctionnalités           */}
            {/* -------------------------------------------------- */}
            <div className="mt-5">
                <Button
                    variant="outline"
                    size="sm"
                    className={`w-full mb-2 flex items-center justify-between sm:hidden text-xs h-7 ${showTable ? "border-primary" : ""
                        }`}
                    onClick={() => setShowTable((v) => !v)}
                >
                    <span className="text-xs font-medium">Tableau comparatif des fonctionnalités</span>
                    {showTable ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>

                <h2 className="text-sm sm:text-base font-semibold hidden sm:block">Comparaison des fonctionnalités</h2>

                {(showTable || !isSmallScreen) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="mt-2"
                    >
                        {/* Version mobile - Cards pour chaque fonctionnalité */}
                        {isSmallScreen ? (
                            <div className="space-y-2">
                                {/* Files d'attente */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium border-b">
                                        Files d'attente
                                    </div>
                                    <div className="grid grid-cols-3 divide-x text-center">
                                        <div className="py-1.5 px-1 text-xs bg-blue-50">
                                            <div className="font-medium mb-0.5 text-blue-700 text-[10px]">Gratuit</div>
                                            <div className="text-[11px]">1</div>
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-green-50">
                                            <div className="font-medium mb-0.5 text-green-700 text-[10px]">Basique</div>
                                            <div className="text-[11px]">3</div>
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-purple-50">
                                            <div className="font-medium mb-0.5 text-purple-700 text-[10px]">Premium</div>
                                            <div className="text-[11px]">Illimité</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Clients par jour */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium border-b">
                                        Clients par jour
                                    </div>
                                    <div className="grid grid-cols-3 divide-x text-center">
                                        <div className="py-1.5 px-1 text-xs bg-blue-50">
                                            <div className="font-medium mb-0.5 text-blue-700 text-[10px]">Gratuit</div>
                                            <div className="text-[11px]">20</div>
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-green-50">
                                            <div className="font-medium mb-0.5 text-green-700 text-[10px]">Basique</div>
                                            <div className="text-[11px]">100</div>
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-purple-50">
                                            <div className="font-medium mb-0.5 text-purple-700 text-[10px]">Premium</div>
                                            <div className="text-[11px]">Illimité</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications SMS */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium border-b">
                                        Notifications SMS
                                    </div>
                                    <div className="grid grid-cols-3 divide-x text-center">
                                        <div className="py-1.5 px-1 text-xs bg-blue-50">
                                            <div className="font-medium mb-0.5 text-blue-700 text-[10px]">Gratuit</div>
                                            <X className="h-3 w-3 mx-auto text-red-500" />
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-green-50">
                                            <div className="font-medium mb-0.5 text-green-700 text-[10px]">Basique</div>
                                            <Check className="h-3 w-3 mx-auto text-green-500" />
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-purple-50">
                                            <div className="font-medium mb-0.5 text-purple-700 text-[10px]">Premium</div>
                                            <Check className="h-3 w-3 mx-auto text-green-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Support */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium border-b">
                                        Support
                                    </div>
                                    <div className="grid grid-cols-3 divide-x text-center">
                                        <div className="py-1.5 px-1 text-xs bg-blue-50">
                                            <div className="font-medium mb-0.5 text-blue-700 text-[10px]">Gratuit</div>
                                            <div className="text-[11px]">Email</div>
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-green-50">
                                            <div className="font-medium mb-0.5 text-green-700 text-[10px]">Basique</div>
                                            <div className="text-[11px]">Email</div>
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-purple-50">
                                            <div className="font-medium mb-0.5 text-purple-700 text-[10px]">Premium</div>
                                            <div className="text-[11px]">Prioritaire</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistiques */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium border-b">
                                        Statistiques avancées
                                    </div>
                                    <div className="grid grid-cols-3 divide-x text-center">
                                        <div className="py-1.5 px-1 text-xs bg-blue-50">
                                            <div className="font-medium mb-0.5 text-blue-700 text-[10px]">Gratuit</div>
                                            <X className="h-3 w-3 mx-auto text-red-500" />
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-green-50">
                                            <div className="font-medium mb-0.5 text-green-700 text-[10px]">Basique</div>
                                            <Check className="h-3 w-3 mx-auto text-green-500" />
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-purple-50">
                                            <div className="font-medium mb-0.5 text-purple-700 text-[10px]">Premium</div>
                                            <Check className="h-3 w-3 mx-auto text-green-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* API */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium border-b">
                                        Intégration API
                                    </div>
                                    <div className="grid grid-cols-3 divide-x text-center">
                                        <div className="py-1.5 px-1 text-xs bg-blue-50">
                                            <div className="font-medium mb-0.5 text-blue-700 text-[10px]">Gratuit</div>
                                            <X className="h-3 w-3 mx-auto text-red-500" />
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-green-50">
                                            <div className="font-medium mb-0.5 text-green-700 text-[10px]">Basique</div>
                                            <X className="h-3 w-3 mx-auto text-red-500" />
                                        </div>
                                        <div className="py-1.5 px-1 text-xs bg-purple-50">
                                            <div className="font-medium mb-0.5 text-purple-700 text-[10px]">Premium</div>
                                            <Check className="h-3 w-3 mx-auto text-green-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Version desktop - Table classique */
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-1.5 px-3">Fonctionnalité</th>
                                            <th className="text-center py-1.5 px-3 bg-blue-50">
                                                <span className="text-blue-700">Gratuit</span>
                                            </th>
                                            <th className="text-center py-1.5 px-3 bg-green-50">
                                                <span className="text-green-700">Basique</span>
                                            </th>
                                            <th className="text-center py-1.5 px-3 bg-purple-50">
                                                <span className="text-purple-700">Premium</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">Files d'attente</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50">1</td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50">3</td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50">Illimité</td>
                                        </tr>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">Clients par jour</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50">20</td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50">100</td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50">Illimité</td>
                                        </tr>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">Notifications SMS</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50"><X className="h-3 w-3 mx-auto text-red-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                        </tr>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">Statistiques avancées</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50"><X className="h-3 w-3 mx-auto text-red-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                        </tr>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">QR Codes personnalisés</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50"><X className="h-3 w-3 mx-auto text-red-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                        </tr>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">Support</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50">Email</td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50">Email</td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50">Prioritaire</td>
                                        </tr>
                                        <tr className="border-b hover:bg-muted/10">
                                            <td className="py-1.5 px-3">Intégration API</td>
                                            <td className="text-center py-1.5 px-3 bg-blue-50/50"><X className="h-3 w-3 mx-auto text-red-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-green-50/50"><X className="h-3 w-3 mx-auto text-red-500" /></td>
                                            <td className="text-center py-1.5 px-3 bg-purple-50/50"><Check className="h-3 w-3 mx-auto text-green-500" /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* -------------------------------------------------- */}
            {/* FAQ                                              */}
            {/* -------------------------------------------------- */}
            <div className="mt-5">
                <Button
                    variant="outline"
                    size="sm"
                    className={`w-full mb-2 flex items-center justify-between sm:hidden text-xs h-7 ${showFAQ ? "border-primary" : ""
                        }`}
                    onClick={() => setShowFAQ((v) => !v)}
                >
                    <span className="text-xs font-medium">Questions fréquentes</span>
                    {showFAQ ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>

                <h2 className="text-sm sm:text-base font-semibold hidden sm:block">Questions fréquentes</h2>

                {(showFAQ || !isSmallScreen) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="space-y-2 sm:space-y-3 mt-2"
                    >
                        <div className="bg-background border rounded-md p-2 sm:p-3">
                            <h3 className="text-xs sm:text-sm font-medium mb-1">Comment changer de forfait ?</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Vous pouvez changer de forfait à tout moment en cliquant sur le bouton "Mettre à niveau" ou "Rétrograder"
                                correspondant au forfait souhaité. La facturation sera ajustée au prorata.
                            </p>
                        </div>

                        <div className="bg-background border rounded-md p-2 sm:p-3">
                            <h3 className="text-xs sm:text-sm font-medium mb-1">Que se passe-t-il si je dépasse mes limites ?</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Si vous atteignez la limite de files d'attente ou de clients de votre forfait,
                                vous ne pourrez plus en créer d'autres. Vous serez notifié et invité à effectuer une mise à niveau.
                            </p>
                        </div>

                        <div className="bg-background border rounded-md p-2 sm:p-3">
                            <h3 className="text-xs sm:text-sm font-medium mb-1">Comment sont calculés les clients par jour ?</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Chaque client qui rejoint une file d'attente est comptabilisé dans votre quota journalier.
                                Les compteurs sont remis à zéro chaque jour à minuit, heure locale.
                            </p>
                        </div>

                        <div className="bg-background border rounded-md p-2 sm:p-3">
                            <h3 className="text-xs sm:text-sm font-medium mb-1">Puis-je annuler mon abonnement à tout moment ?</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Oui, vous pouvez annuler votre abonnement à tout moment en passant au forfait Gratuit.
                                Votre abonnement payant restera actif jusqu'à la fin de la période de facturation.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
