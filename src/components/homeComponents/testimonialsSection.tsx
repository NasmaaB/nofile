'use client';

import React from 'react';
import { motion, useAnimation } from 'framer-motion';

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.5 },
    }),
};

const testimonials = [
    {
        initial: "S",
        name: "Sophie Martin",
        role: "Cabinet médical",
        text:
            "Avant NoFile, nos patients attendaient parfois des heures. Aujourd'hui, ils reçoivent un SMS et reviennent pile à leur tour – la satisfaction a bondi de 80 %!",
    },
    {
        initial: "T",
        name: "Thomas Dupont",
        role: "Restaurant gastronomique",
        text:
            "En période d’affluence, la file numérique évite les attroupements à l’entrée ; les clients patientent sereinement en terrasse.",
    },
    {
        initial: "J",
        name: "Julie Legrand",
        role: "Boutique de mode",
        text:
            "Pendant les soldes, les clientes scannent le QR code pour la cabine, continuent leur shopping et reçoivent une alerte quand c’est libre : ventes +25 %.",
    },
    {
        initial: "H",
        name: "Hugo Lemaire",
        role: "Salon de coiffure",
        text:
            "Les rendez‑vous sans RDV étaient un casse‑tête. NoFile affiche la file en temps réel ; les clients peuvent aller prendre un café et revenir juste à temps pour leur coupe.",
    },
    {
        initial: "N",
        name: "Nathalie Lopez",
        role: "Bar à ongles",
        text:
            "Les clientes s’inscrivent via leur smartphone, reçoivent un SMS cinq minutes avant leur tour ; le coin attente n’est plus bondé et notre note Google a grimpé !",
    },
];

export default function TestimonialsSection() {
    return (
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-accent/5">
            <div className="container mx-auto">
                {/* Titre */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-4 sm:mb-14"
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                        Ce que nos <span className="nofile-text-gradient">clients</span> disent
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-justify text-muted-foreground max-w-2xl mx-auto">
                        Des cabinets médicaux aux services publics : ils gagnent tous du temps grâce à NoFile.
                    </p>
                </motion.div>

                {/* Carrousel mobile / grille desktop */}
                <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-4 md:gap-8 md:overflow-x-auto md:snap-x md:snap-mandatory items-stretch">
                    {testimonials.map((t, i) => (
                        <TestimonialCard key={t.name} index={i} {...t} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/* --- Carte individuelle ---------------------------------------------- */

interface CardProps {
    initial: string;
    name: string;
    role: string;
    text: string;
    index: number;
}

function TestimonialCard({ initial, name, role, text, index }: CardProps) {
    const controls = useAnimation();

    return (
        <motion.div
            variants={fadeIn}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            animate={controls}
            onTapStart={() => controls.stop()} // tap = pause auto-scroll Framer si animé
            className="snap-center w-full sm:w-[320px] md:w-[380px] lg:w-[420px] flex-shrink-0 bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all p-6 flex flex-col m-0 md:m-4 justify-between"
        >
            {/* En-tête */}
            <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary mr-4">
                    {initial}
                </div>
                <div>
                    <h4 className="text-sm md:text-base lg:text-lg font-semibold">{name}</h4>
                    <p className="text-xs text-muted-foreground">{role}</p>
                </div>
            </div>

            {/* Témoignage */}
            <p className=" text-xs sm:text-sm md:text-base text-muted-foreground text-justify mb-4 flex-1 leading-relaxed">“{text}”</p>

            {/* Étoiles */}
            <div className="flex text-yellow-500 gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                    <svg key={idx} className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        </motion.div>
    );
}
