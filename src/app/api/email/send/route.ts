import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, subject, text, html } = body;

        // Validation des entrées
        if (!to || !subject || !text) {
            return NextResponse.json(
                { error: 'Les champs to, subject et text sont requis' },
                { status: 400 }
            );
        }

        // Ici, vous intégreriez votre service d'envoi d'email
        // Par exemple, avec Nodemailer, SendGrid, ou un autre service

        // Exemple simulé:
        console.log('Envoi d\'email:', { to, subject, text, html });

        // Simule un délai pour les tests
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi de l\'email' },
            { status: 500 }
        );
    }
} 