// Improved PricingSection with clean glass cards and better mobile horizontal scroll
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.5 },
    }),
};

interface Prices {
    basic: number;
    premium: number;
}
interface PricingSectionProps {
    prices: Prices;
}

const PricingSection: React.FC<PricingSectionProps> = ({ prices }) => {
    const plans = [
        {
            id: "free",
            name: "Gratuit",
            price: 0,
            mostPopular: false,
            description: "Parfait pour démarrer et découvrir NoFile",
            features: [
                "1 file d'attente active",
                "20 clients par jour",
                "Fonctionnalités de base",
                "1 utilisateur",
                "Support email",
            ],
            negatives: [
                "Notifications SMS",
                "Statistiques avancées",
                // "Intégration API",
            ],
            cta: { label: "Commencer", variant: "outline" as const, href: "/auth/register" },
        },
        {
            id: "basic",
            name: "Basique",
            price: prices.basic,
            mostPopular: true,
            description: "Idéal petites entreprises",
            features: [
                "3 files actives",
                "100 clients / jour",
                "Notifications SMS",
                "Stats basiques",
                "3 utilisateurs",
                "QR Codes personnalisés",
            ],
            negatives: ["Intégration API"],
            cta: { label: "Choisir", variant: "gradient" as const, href: "/auth/register" },
        },
        {
            id: "premium",
            name: "Premium",
            price: prices.premium,
            mostPopular: false,
            description: "Pour grandes structures",
            features: [
                "Files illimitées",
                "Clients illimités",
                "SMS illimités",
                "Stats avancées",
                "Utilisateurs illimités",
                "Support prioritaire",
                "Intégration API",
            ],
            negatives: [],
            cta: { label: "Passer au Premium", variant: "gradient" as const, href: "/auth/register" },
        },
    ];

    return (
        <section id="pricing" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
            <div className="container mx-auto">
                {/* title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-14"
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                        Des <span className="nofile-text-gradient">tarifs</span> adaptés à vos besoins
                    </h2>
                    <p className=" text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground text-justify max-w-2xl mx-auto">
                        Choisissez l'offre qui correspond le mieux à votre activité et évoluez avec nous.
                    </p>
                </motion.div>

                {/* cards */}
                <div className="flex gap-6 overflow-x-auto scroll-smooth snap-x md:grid md:grid-cols-3 md:gap-8 md:overflow-visible no-scrollbar pb-4 md:pb-0">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            variants={fadeIn}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={i}
                            className="snap-center w-[280px] md:w-auto flex-shrink-0 md:flex-shrink md:snap-none"
                        >
                            {/* outer gradient ring only for popular */}
                            <div
                                className={`relative w-full rounded-2xl p-[1px] ${plan.mostPopular ? "bg-gradient-to-br from-primary to-accent" : "bg-border/40"
                                    }`}
                            >
                                {/* inner glass card */}
                                <div className="flex flex-col h-auto w-full rounded-2xl bg-background/70 backdrop-blur-xl ring-1 ring-border/20 hover:shadow-lg transition-all">
                                    {/* header */}
                                    <div className="p-5 sm:p-6 border-b border-border/20">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            {plan.name}
                                            {plan.mostPopular && (
                                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    <Sparkles className="h-3 w-3" /> Populaire
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-end gap-1 mt-3">
                                            <span className="text-4xl font-bold">
                                                {plan.price === 0 ? 0 : plan.price}
                                                {plan.price === 0 ? "" : "€"}
                                            </span>
                                            <span className="text-xs text-muted-foreground mb-1">/mois</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                                    </div>

                                    {/* features */}
                                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                                        <ul className="space-y-2 text-sm flex-1">
                                            {plan.features.map((f) => (
                                                <li key={f} className="flex gap-2 items-start">
                                                    <Check className="h-4 w-4 text-green-500" /> <span>{f}</span>
                                                </li>
                                            ))}
                                            {plan.negatives.map((n) => (
                                                <li key={n} className="flex gap-2 items-start opacity-50 line-through">
                                                    <X className="h-4 w-4" /> <span>{n}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link href={plan.cta.href} className="mt-4">
                                            <Button size="sm" variant={plan.cta.variant} className="w-full">
                                                {plan.cta.label}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* footnote */}
                <p className="mt-8  text-xs text-muted-foreground text-center max-w-2xl mx-auto">
                    Facturation au prorata lors du changement de forfait. Compteurs remis à zéro chaque jour à minuit.
                    Annulable à tout moment. Des notifications sont envoyées si vous dépassez vos limites.
                </p>
            </div>
        </section>
    );
};

export default PricingSection;
