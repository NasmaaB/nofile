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
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Logo from '@/components/common/logo_nofile';
import dynamic from 'next/dynamic';

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
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Des fonctionnalités conçues pour <span className="nofile-text-gradient">l'efficacité</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Découvrez les outils innovants qui vous permettront de fluidifier votre gestion des files d'attente.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {/* Feature 1 */}
              <motion.div
                variants={fadeIn}
                className="bg-card rounded-xl p-5 sm:p-6 border shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-11 w-11 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Gestion des clients</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Enregistrez rapidement vos clients, suivez leur statut en temps réel et gérez efficacement chaque interaction.
                </p>
                <ul className="space-y-2">
                  {[
                    'Ajout rapide avec contact',
                    'Suivi en temps réel des statuts',
                    'Numérotation automatique',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* TODO: replicate similar responsive tweaks for the rest of the features (2‑6) */}
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Des <span className="nofile-text-gradient">tarifs</span> adaptés à vos besoins
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Choisissez l'offre qui correspond le mieux à votre activité et évoluez avec nous.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid gap-6 sm:gap-8 md:grid-cols-3"
            >
              {/* Plan Gratuit */}
              <motion.div
                variants={fadeIn}
                className="bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-5 sm:p-6 border-b">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Gratuit</h3>
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl sm:text-4xl font-bold">0€</span>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-1">/mois</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Parfait pour démarrer et découvrir NoFile
                  </p>
                </div>
                <div className="p-5 sm:p-6">
                  <ul className="space-y-3 mb-6">
                    {[
                      "1 file d'attente active",
                      '20 clients par jour',
                      'Fonctionnalités de base',
                      '1 utilisateur',
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register">
                    <Button className="w-full" variant="outline" size="sm">
                      Commencer gratuitement
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* TODO: replicate responsive tweaks for Basique & Premium plans */}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-accent/5">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Ce que nos <span className="nofile-text-gradient">clients</span> disent
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Découvrez comment NoFile a transformé la gestion des files d'attente pour nos clients.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid gap-6 sm:gap-8 md:grid-cols-3"
            >
              {/* Testimonial 1 (responsive tweaks applied) */}
              <motion.div
                variants={fadeIn}
                className="bg-card rounded-xl p-5 sm:p-6 border shadow-sm"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center text-base sm:text-xl font-bold text-primary mr-3 sm:mr-4">
                    S
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold">Sophie Martin</h4>
                    <p className="text-[11px] sm:text-sm text-muted-foreground">Cabinet Médical</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  "Avant NoFile, nos patients attendaient parfois des heures dans notre salle d'attente. Maintenant, ils reçoivent un SMS quand c'est bientôt leur tour. La satisfaction a augmenté de 80% !"
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>

              {/* TODO: replicate responsive tweaks for Testimonials 2 & 3 */}
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
                Prêt à <span className="nofile-text-gradient">transformer</span> votre expérience client ?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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
        <footer className="py-10 sm:py-12 px-4 sm:px-6 bg-background border-t">
          <div className="container mx-auto">
            <div className="grid gap-6 sm:gap-8 md:grid-cols-4 mb-8">
              <div>
                <Logo showText className="mb-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  NoFile v3 est la solution moderne de gestion des files d'attente pour toutes les entreprises soucieuses d'offrir une expérience client optimale.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm sm:text-base">Produit</h4>
                <ul className="space-y-2">
                  {[
                    ['#features', 'Fonctionnalités'],
                    ['#pricing', 'Tarifs'],
                    ['#', 'FAQ'],
                    ['#', "Guide d'utilisation"],
                  ].map(([href, label]) => (
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

              <div className="space-y-4">
                <h4 className="font-semibold text-sm sm:text-base">Entreprise</h4>
                <ul className="space-y-2">
                  {[
                    ['#', 'À propos'],
                    ['#', 'Nous contacter'],
                    ['#', 'Carrières'],
                    ['#', 'Blog'],
                  ].map(([href, label]) => (
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

              <div className="space-y-4">
                <h4 className="font-semibold text-sm sm:text-base">Légal</h4>
                <ul className="space-y-2">
                  {[
                    ['#', "Conditions d'utilisation"],
                    ['#', 'Politique de confidentialité'],
                    ['#', 'Mentions légales'],
                  ].map(([href, label]) => (
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
            </div>

            <div className="pt-8 border-t text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                © {new Date().getFullYear()} NoFile v3. Tous droits réservés.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
