// Improved mobile responsiveness while preserving desktop design
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  QrCode,
  Bell,
  BarChart2,
  ChevronRight,
  ArrowRight,
  Check,
  Twitter, Linkedin, Github
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Logo from '@/components/common/logo_nofile';
import LogoSmall from '@/components/common/logo_small';
import dynamic from 'next/dynamic';
import PricingSection from '@/components/homeComponents/pricingSection';
import TestimonialsSection from '@/components/homeComponents/testimonialsSection';



// Dynamic imports to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
const ThemeProvider = dynamic(() => import('@/context/theme-context').then(mod => mod.ThemeProvider), {
  ssr: false,
});

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  // Animation data state to avoid hydration issues
  const [animationData, setAnimationData] = useState<any>(null);

  // pricing section
  const prices = {
    basic: 39,
    premium: 69,
  };

  // feature - fonctionnalite 
  const features = [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Ajout rapide avec contact',
      desc: 'Enregistrez un client en quelques secondes avec nom et téléphone.',
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: 'Suivi en temps réel',
      desc: 'Visualisez la progression des clients dans la file à tout moment.',
    },
    {
      icon: <QrCode className="h-6 w-6 text-primary" />,
      title: 'Inscription par QR code',
      desc: 'Vos clients scannent, rejoignent la file et reçoivent leur numéro instantanément.',
    },
    {
      icon: <Bell className="h-6 w-6 text-primary" />,
      title: 'Notifications automatiques',
      desc: 'Prévenez les clients quand leur tour approche sans lever le petit doigt.',
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-primary" />,
      title: 'Statistiques détaillées',
      desc: 'Analysez vos pics d’affluence et temps d’attente moyen.',
    },
  ];

  useEffect(() => {
    import('@/animations/animation.json').then((data) => {
      setAnimationData(data.default);
    });
  }, []);

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header
          className=" top-0 z-50 border-b bg-background/80 backdrop-blur-sm
                 px-2 sm:px-4 lg:px-8 xl:px-10
                 py-2 sm:py-2 lg:py-3"
        >
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Logo animated className="ml-1 h-6 sm:h-5 md:h-7 lg:h-8" />

            {/* NAVIGATION */}
            <nav className="ml-auto flex items-center gap-1 xs:gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8">
              {/* Bouton Se connecter */}
              <Link href="/auth/login">
                <Button
                  size="sm"
                  variant="ghost"

                  className="min-w-0
                         text-xs sm:text-sm md:text-base lg:text-lg 
                         h-1 sm:h-1 md:h-1 lg:h-10
                         px-2 sm:px-3 md:px-4  
                         py-1.5 sm:py-2 md:py-2.5 lg:py-3
                         text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  Se connecter
                </Button>
              </Link>

              {/* Bouton S'inscrire */}
              <Link href="/auth/register">
                <Button
                  size="sm"
                  variant="gradient"
                  animation="glow"
                  className="text-xs sm:text-sm md:text-base lg:text-lg 
                         h-8 sm:h-1 md:h-8 lg:h-10 
                         px-2.5 sm:px-4 md:px-4.5 lg:px-5.5 "
                >
                  S'inscrire
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight text-justify sm:text-left">
                <span className="nofile-text-gradient">Éliminez les files d'attente</span> et améliorez l'expérience client
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mb-8">
                NoFile est une solution moderne pour gérer efficacement vos files d'attente, optimiser le service client et booster la satisfaction.
              </p>

              {/* Animation mobile */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="sm:hidden relative max-w-md w-full mx-auto md:max-w-full mb-4"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                  <div className="bg-gradient-to-br from-gray-50 to-white aspect-video flex items-center justify-center p-6 sm:p-10">
                    {animationData && (
                      <Lottie animationData={animationData} loop autoPlay className="w-full h-auto" />
                    )}
                  </div>

                  {/* Info card — Clients en attente (hidden on extra‑small for breathing room) */}
                  <motion.div
                    className="sm:hidden flex items-center gap-1.5 absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow border border-gray-100"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    {/* Icône */}
                    <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-green-500" />
                    </div>

                    {/* Texte */}
                    <div className="flex flex-col leading-none">
                      <p className="text-[9px] text-gray-500">Clients</p>
                      <p className="text-xs font-semibold text-gray-800">12</p>
                    </div>
                  </motion.div>


                  {/* Info card — Temps moyen */}
                  <motion.div
                    className="sm:hidden flex items-center gap-1.5 absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow border border-gray-100"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    {/* Icône cercle */}
                    <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                    </div>

                    {/* Texte */}
                    <div className="flex flex-col leading-none">
                      <p className="text-[9px] text-gray-500">Temps</p>
                      <p className="text-xs font-semibold text-gray-800">4.5 min</p>
                    </div>
                  </motion.div>


                </div>

                {/* Glow effect — adjust blur on small screens */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent opacity-20 blur-md sm:blur-xl rounded-xl -z-10" />
              </motion.div>
              <p className="sm:hidden text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground text-justify mb-4">
                NoFile est une solution moderne pour gérer efficacement vos files d'attente, optimiser le service client et booster la satisfaction.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    variant="gradient"
                    animation="glow"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    Commencer gratuitement
                  </Button>
                </Link>
                <Link href="#features" className='hidden sm:block'>
                  <Button
                    size="lg"
                    variant="outline"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    Découvrir les fonctionnalités
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden sm:block relative max-w-md w-full mx-auto md:max-w-full"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                <div className="bg-gradient-to-br from-gray-50 to-white aspect-video flex items-center justify-center p-6 sm:p-10">
                  {animationData && (
                    <Lottie animationData={animationData} loop autoPlay className="w-full h-auto" />
                  )}
                </div>

                {/* Info card — Clients en attente (hidden on extra‑small for breathing room) */}
                <motion.div
                  className="hidden sm:flex items-center gap-3 absolute top-4 sm:top-6 right-4 sm:right-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-md border border-gray-100"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Clients en attente</p>
                    <p className="text-sm sm:font-semibold text-gray-800">12</p>
                  </div>
                </motion.div>

                {/* Info card — Temps moyen */}
                <motion.div
                  className="hidden sm:flex items-center gap-3 absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-md border border-gray-100"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Temps moyen</p>
                    <p className="text-sm sm:font-semibold text-gray-800">4.5 min</p>
                  </div>
                </motion.div>
              </div>

              {/* Glow effect — adjust blur on small screens */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent opacity-20 blur-md sm:blur-xl rounded-xl -z-10" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-accent/5">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Des fonctionnalités conçues pour{' '}
                <span className="nofile-text-gradient">l'efficacité</span>
              </h2>
              <p className="sm:hidden text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground text-justify max-w-2xl mx-auto">
                Découvrez les outils clés qui simplifient la gestion des files d'attente — vos clients peuvent même
                s’inscrire d’un simple scan.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3 border-0 border-none bg-transparent shadow-none "
            >
              {features.map(({ icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  variants={fadeIn}
                  className="flex items-start gap-4  !border-0 !border-none !ring-0 !shadow-none"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full">
                    {icon}
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">{title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>



        {/* Pricing Section */}
        <PricingSection prices={prices} />


        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Call to Action */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">
                Prêt à <span className="nofile-text-gradient">transformer</span> votre expérience client ?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-2xl mx-auto">
                Commencez gratuitement dès aujourd'hui et découvrez comment NoFile peut améliorer votre efficacité et la satisfaction de vos clients.
              </p>
              <Link href="/auth/register">
                <Button size="lg" variant="gradient" animation="glow" className="px-6 sm:px-8">
                  Commencer gratuitement
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-background border-t pt-12 pb-10 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="grid gap-10 sm:gap-12 md:grid-cols-5">
              {/* Brand */}
              <div className="md:col-span-2">
                <LogoSmall showText className="mb-4" />
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                  NoFile est la solution moderne pour gérer vos files d’attente et offrir une
                  expérience client optimale.
                </p>

                {/* Socials (optionnel, à retirer si inutile) */}
                <div className="flex gap-3 mt-6">

                  <a href="#"
                    aria-label="Twitter"
                    className="p-2 rounded-full bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>

                  <a href="#"
                    aria-label="LinkedIn"
                    className="p-2 rounded-full bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>

                  <a href="#"
                    aria-label="GitHub"
                    className="p-2 rounded-full bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Links */}
              {[
                {
                  title: 'Produit',
                  links: [
                    ['#features', 'Fonctionnalités'],
                    ['#pricing', 'Tarifs'],
                    ['#', 'FAQ'],
                    ['#', "Guide d'utilisation"],
                  ],
                },
                {
                  title: 'Entreprise',
                  links: [
                    ['#', 'À propos'],
                    ['#', 'Nous contacter'],
                    ['#', 'Carrières'],
                    ['#', 'Blog'],
                  ],
                },
                {
                  title: 'Légal',
                  links: [
                    ['#', "Conditions d'utilisation"],
                    ['#', 'Politique de confidentialité'],
                    ['#', 'Mentions légales'],
                  ],
                },
              ].map(({ title, links }) => (
                <div key={title} className="space-y-4">
                  <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
                  <ul className="space-y-2">
                    {links.map(([href, label]) => (
                      <li key={label}>
                        <a
                          href={href}
                          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <div>
                <p>© {new Date().getFullYear()} NoFile. Tous droits réservés.</p>
              </div>

              {/* Sélecteur de langue facultatif */}
              <div className="flex gap-3">
                <a href="#" className="hover:text-foreground transition-colors">
                  FR
                </a>
                <span className="opacity-40">|</span>
                <a href="#" className="hover:text-foreground transition-colors">
                  EN
                </a>
              </div>
            </div>
          </div >
        </footer >

      </div >
    </ThemeProvider >
  );
}
