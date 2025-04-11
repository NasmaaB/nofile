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
import Logo from '@/components/common/logo';
import dynamic from 'next/dynamic';

// Import dynamique de Lottie pour éviter les erreurs côté serveur
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Import dynamique du ThemeProvider pour éviter les erreurs côté serveur
const ThemeProvider = dynamic(() => import('@/context/theme-context').then(mod => mod.ThemeProvider), {
  ssr: false,
});

// Animations variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  // Animation data state pour éviter les problèmes d'hydratation
  const [animationData, setAnimationData] = useState<any>(null);

  // Charger les données d'animation côté client uniquement
  useEffect(() => {
    import('@/animations/animation.json').then(data => {
      setAnimationData(data.default);
    });
  }, []);

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="py-4 px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b">
          <div className="container mx-auto flex justify-between items-center">
            <Logo animated />

            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="gradient" animation="glow">S'inscrire</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                <span className="nofile-text-gradient">Éliminez les files d'attente</span> et améliorez l'expérience client
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                NoFile v3 est une solution moderne pour gérer efficacement vos files d'attente, optimiser le service client et booster la satisfaction.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="xl" variant="gradient" animation="glow" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Commencer gratuitement
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="xl" variant="outline" rightIcon={<ChevronRight className="h-4 w-4" />}>
                    Découvrir les fonctionnalités
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                <div className="bg-gradient-to-br from-gray-50 to-white aspect-[4/3] flex items-center justify-center p-10">
                  {/* Animation Lottie */}
                  <Lottie
                    animationData={animationData}
                    loop
                    autoPlay
                    className="w-full h-auto"
                  />
                </div>

                {/* Carte d'info - Clients en attente */}
                <motion.div
                  className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Clients en attente</p>
                      <p className="font-semibold text-gray-800">12</p>
                    </div>
                  </div>
                </motion.div>

                {/* Carte d'info - Temps moyen */}
                <motion.div
                  className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temps moyen</p>
                      <p className="font-semibold text-gray-800">4.5 min</p>
                    </div>
                  </div>
                </motion.div>
              </div>



              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent opacity-20 blur-xl rounded-xl -z-10"></div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 px-6 bg-accent/5">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Des fonctionnalités conçues pour <span className="nofile-text-gradient">l'efficacité</span></h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Découvrez les outils innovants qui vous permettront de fluidifier votre gestion des files d'attente.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Feature 1 */}
              <motion.div variants={fadeIn} className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gestion des clients</h3>
                <p className="text-muted-foreground mb-4">Enregistrez rapidement vos clients, suivez leur statut en temps réel et gérez efficacement chaque interaction.</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Ajout rapide avec contact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Suivi en temps réel des statuts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Numérotation automatique</span>
                  </li>
                </ul>
              </motion.div>

              {/* Features 2-6 comme avant... */}

            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 px-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Des <span className="nofile-text-gradient">tarifs</span> adaptés à vos besoins</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choisissez l'offre qui correspond le mieux à votre activité et évoluez avec nous.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Plan Gratuit */}
              <motion.div variants={fadeIn} className="bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-semibold mb-2">Gratuit</h3>
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-4xl font-bold">0€</span>
                    <span className="text-sm text-muted-foreground mb-1">/mois</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Parfait pour démarrer et découvrir NoFile
                  </p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">1 file d'attente active</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">20 clients par jour</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Fonctionnalités de base</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">1 utilisateur</span>
                    </li>
                  </ul>
                  <Link href="/auth/register">
                    <Button className="w-full" variant="outline">
                      Commencer gratuitement
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Plans Basique et Premium comme avant... */}

            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 px-6 bg-accent/5">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ce que nos <span className="nofile-text-gradient">clients</span> disent</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Découvrez comment NoFile a transformé la gestion des files d'attente pour nos clients.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Testimonial 1 */}
              <motion.div variants={fadeIn} className="bg-card rounded-xl p-6 border shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary mr-4">
                    S
                  </div>
                  <div>
                    <h4 className="font-semibold">Sophie Martin</h4>
                    <p className="text-sm text-muted-foreground">Cabinet Médical</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Avant NoFile, nos patients attendaient parfois des heures dans notre salle d'attente. Maintenant, ils reçoivent un SMS quand c'est bientôt leur tour. La satisfaction a augmenté de 80% !"
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="h-5 w-5 text-yellow-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>

              {/* Testimonial 2 */}
              <motion.div variants={fadeIn} className="bg-card rounded-xl p-6 border shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary mr-4">
                    T
                  </div>
                  <div>
                    <h4 className="font-semibold">Thomas Dupont</h4>
                    <p className="text-sm text-muted-foreground">Restaurant Gastronomique</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "NoFile nous a permis de gérer efficacement nos réservations et notre liste d'attente, même en période d'affluence. Nos clients peuvent profiter d'une promenade en attendant leur table plutôt que de s'agglutiner à l'entrée."
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="h-5 w-5 text-yellow-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>

              {/* Testimonial 3 */}
              <motion.div variants={fadeIn} className="bg-card rounded-xl p-6 border shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary mr-4">
                    J
                  </div>
                  <div>
                    <h4 className="font-semibold">Julie Legrand</h4>
                    <p className="text-sm text-muted-foreground">Boutique de Mode</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Pendant les soldes, la gestion des cabines d'essayage était un cauchemar. Avec NoFile, nos clientes s'inscrivent facilement via le QR code et peuvent continuer leur shopping jusqu'à ce qu'une cabine se libère."
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="h-5 w-5 text-yellow-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 md:py-24 px-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à <span className="nofile-text-gradient">transformer</span> votre expérience client ?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Commencez gratuitement dès aujourd'hui et découvrez comment NoFile peut améliorer votre efficacité et la satisfaction de vos clients.
              </p>
              <Link href="/auth/register">
                <Button size="xl" variant="gradient" animation="glow" className="px-8">
                  Commencer gratuitement
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 bg-background border-t">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <Logo showText={true} className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  NoFile v3 est la solution moderne de gestion des files d'attente pour toutes les entreprises soucieuses d'offrir une expérience client optimale.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Produit</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Fonctionnalités
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Tarifs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Guide d'utilisation
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Entreprise</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      À propos
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Nous contacter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Carrières
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Légal</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Conditions d'utilisation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Politique de confidentialité
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Mentions légales
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t text-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} NoFile v3. Tous droits réservés.
              </p>
            </div>
          </div>
        </footer>
      </div >
    </ThemeProvider >
  );
}