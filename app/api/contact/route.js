// app/api/contact/route.js
import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer'; // Vous devriez installer 'nodemailer' : npm install nodemailer

export async function POST(req) {
    try {
        const { name, email, subject, message } = await req.json();

        // Validation des données reçues
        if (!name || !email || !subject || !message) {
            return NextResponse.json({ message: 'Tous les champs sont obligatoires.' }, { status: 400 });
        }

        // Validation simple de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ message: 'Adresse email invalide.' }, { status: 400 });
        }

        // --- PARTIE À DÉCOMMENTER ET CONFIGURER POUR UN VRAI ENVOI D'EMAIL ---
        /*
        // Configuration du transporteur d'emails (Exemple avec Gmail - PAS RECOMMANDÉ POUR LA PRODUCTION)
        // Pour la production, utilisez un service SMTP dédié ou une clé API de service comme SendGrid.
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Ou 'outlook', ou un hôte SMTP custom
            auth: {
                user: 'votre_email_de_service@gmail.com', // L'adresse email qui envoie le message
                pass: 'votre_mot_de_passe_ou_mot_de_passe_app_gmail', // Utilisez un mot de passe d'application si Gmail
            },
        });

        // Options de l'email
        const mailOptions = {
            from: 'votre_email_de_service@gmail.com', // L'expéditeur qui apparaîtra
            to: 'votre_adresse_reception@example.com', // L'adresse où vous voulez recevoir les messages
            replyTo: email, // Permet de répondre directement à l'expéditeur du formulaire
            subject: `Nouveau message de contact : ${subject} (De ${name})`,
            html: `
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Sujet :</strong> ${subject}</p>
                <p><strong>Message :</strong></p>
                <p>${message}</p>
            `,
        };

        // Envoi de l'email
        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès !');
        */
        // --- FIN DE LA PARTIE À DÉCOMMENTER ---

        // Si vous n'utilisez pas de service d'email, les logs console sont un bon indicateur en dev
        console.log('--- Nouveau Message de Contact (Logs Serveur) ---');
        console.log(`Nom: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Sujet: ${subject}`);
        console.log(`Message: ${message}`);
        console.log('------------------------------------------------');

        // Simuler un délai d'envoi (peut être supprimé si un vrai envoi est implémenté)
        await new Promise(resolve => setTimeout(resolve, 1000)); 

        return NextResponse.json({ message: 'Message envoyé avec succès !' }, { status: 200 });

    } catch (error) {
        console.error('Erreur dans l\'API de contact:', error);
        // Ajoutez des détails d'erreur pour le débogage si l'envoi d'email échoue
        return NextResponse.json({ message: `Erreur interne du serveur lors de l'envoi du message: ${error.message}` }, { status: 500 });
    }
}
