'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

// Validation schema
const loginSchema = z.object({
    email: z.string().email({ message: 'Email invalide' }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
    const router = useRouter();
    const { signIn, signInWithGoogle, error: authError, loading } = useAuth();
    const [showError, setShowError] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setShowError(false);

        try {
            await signIn(data.email, data.password);
            router.push('/dashboard');
        } catch (error) {
            setShowError(true);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            router.push('/dashboard');
        } catch (error) {
            setShowError(true);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="max-w-md w-full mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Connexion</CardTitle>
                    <CardDescription className="text-center">
                        Entrez vos identifiants pour accéder à votre compte
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Erreur d'authentification */}
                        {(showError && authError) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start"
                            >
                                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{authError}</p>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="Email"
                                    icon={<Mail className="h-4 w-4" />}
                                    error={errors.email?.message}
                                />
                            </div>

                            {/* Mot de passe */}
                            <div>
                                <Input
                                    {...register('password')}
                                    type="password"
                                    placeholder="Mot de passe"
                                    icon={<Lock className="h-4 w-4" />}
                                    error={errors.password?.message}
                                />
                            </div>

                            {/* Lien mot de passe oublié */}
                            <div className="text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        </div>

                        {/* Bouton de connexion */}
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={loading}
                            leftIcon={<LogIn className="h-4 w-4" />}
                            animation="glow"
                        >
                            Se connecter
                        </Button>
                    </form>

                    {/* Séparateur */}
                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-muted"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 bg-card text-muted-foreground">Ou continuer avec</span>
                        </div>
                    </div>

                    {/* Connexion avec Google */}
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleGoogleSignIn}
                        isLoading={loading}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Connexion avec Google
                    </Button>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-center text-muted-foreground">
                        Vous n'avez pas de compte ?{' '}
                        <Link href="/auth/register" className="text-primary hover:underline">
                            S'inscrire
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default LoginForm;