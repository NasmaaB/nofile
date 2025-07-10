import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, message } = body;

        // Validation des entrées
        if (!to || !message) {
            return NextResponse.json(
                { error: 'Les champs to et message sont requis' },
                { status: 400 }
            );
        }

        // Ici, vous intégreriez votre service d'envoi de SMS
        // Par exemple, avec Twilio, Vonage (Nexmo), ou un autre service

        // Exemple simulé:
        console.log('Envoi de SMS:', { to, message });

        // Simule un délai pour les tests
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du SMS:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi du SMS' },
            { status: 500 }
        );
    }
} 