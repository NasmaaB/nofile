'use client'

import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/context/theme-context"
import { AuthProvider } from "@/context/auth-context"
import React, { Suspense } from "react"
import "./globals.css"

// Définition des polices avec des variables constantes
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: true,
})

// Constante pour les classes CSS - pas de concaténation dynamique
const BODY_CLASSES = inter.variable + " " + jetbrainsMono.variable + " font-sans antialiased"

// Composant séparé pour le contenu principal - isole les problèmes d'hydratation
function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center">
        <div className="nofile-spinner"></div>
      </div>
    }>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </Suspense>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={BODY_CLASSES}>
        <MainContent children={children} />
      </body>
    </html>
  )
}
