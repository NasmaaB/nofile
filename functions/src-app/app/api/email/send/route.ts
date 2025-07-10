import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
        const transporter = nodemailer.createTransport({
            host: process.env.ZOHO_SMTP_HOST,
            port: Number(process.env.ZOHO_SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.ZOHO_EMAIL,
                pass: process.env.ZOHO_EMAIL_PASSWORD
            }
        });

        // Définition des options du mail
        const mailOptions = {
            from: `"noFile" <${process.env.ZOHO_EMAIL}>`, // l'expéditeur
            to,         // destinataire
            subject,    // sujet du mail
            text,       // contenu en texte brut
            html: html || text, // contenu HTML, ou fallback au texte brut
        };
        // Exemple simulé:
        // console.log('Envoi d\'email:', { to, subject, text, html });

        // Simule un délai pour les tests
        //await new Promise(resolve => setTimeout(resolve, 1000));

        // Envoi de l'email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email envoyé avec succès :", info.messageId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi de l\'email' },
            { status: 500 }
        );
    }
} 