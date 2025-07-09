// app/api/kakapay-webhook/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importe le client Prisma

// La clé secrète de Kakapay, utilisée pour vérifier la signature des webhooks.
// Doit être dans votre .env (NON NEXT_PUBLIC_)
const KAKAPAY_WEBHOOK_SECRET = process.env.KAKAPAY_SECRET;

export async function POST(req) {
    try {
        const event = await req.json(); // Le corps de l'événement envoyé par Kakapay
        // const signature = req.headers.get('x-kakapay-signature'); // Exemple d'en-tête de signature. Vérifiez la documentation Kakapay.

        // *** TRÈS IMPORTANT : VÉRIFIER LA SIGNATURE DU WEBHOOK POUR LA SÉCURITÉ ***
        // C'est la première chose à faire pour s'assurer que le webhook vient bien de Kakapay.
        // La méthode de vérification dépend de Kakapay (souvent une fonction qui hache le corps
        // de la requête avec la clé secrète avec HMAC et compare à la signature de l'en-tête).
        /*
        if (!isValidKakapayWebhookSignature(event, signature, KAKAPAY_WEBHOOK_SECRET)) {
            console.warn('Signature de webhook Kakapay invalide. Requête rejetée.');
            return NextResponse.json({ message: 'Signature de webhook invalide' }, { status: 401 });
        }
        */

        console.log('--- Webhook Kakapay Reçu ---');
        console.log('Type d\'événement:', event.event_type); // Par exemple: 'transaction.success', 'transaction.failed'
        console.log('Données de l\'événement:', event.data); // Contient les détails de la transaction
        console.log('----------------------------');

        // Récupérez les informations pertinentes du webhook
        const kakapayTransactionId = event.data.id;       // L'ID de transaction unique de Kakapay
        const orderReference = event.data.reference;    // La référence de commande que vous avez envoyée à Kakapay (orderId de votre DB)
        const paymentStatusFromKakapay = event.data.status; // Le statut de paiement envoyé par Kakapay (ex: 'SUCCESS', 'FAILED', 'PENDING')
        const paymentAmount = event.data.amount; // Montant du paiement
        const paymentCurrency = event.data.currency; // Devise du paiement

        let newOrderStatus;
        let newPaymentStatus; // Ajout d'une variable pour le statut de paiement dans la table Payment

        if (paymentStatusFromKakapay === 'SUCCESS') { // Adaptez 'SUCCESS' si Kakapay utilise un autre libellé exact
            newOrderStatus = 'PAID_SUCCESS';
            newPaymentStatus = 'COMPLETED';
            console.log(`Paiement réussi confirmé par webhook pour la commande: ${orderReference}`);

            // Mise à jour du statut de la commande dans la DB
            await prisma.order.update({
                where: { id: orderReference }, // Trouver la commande par notre orderId
                data: {
                    status: newOrderStatus,
                    kakapayTransactionId: kakapayTransactionId, // Enregistrer l'ID de transaction Kakapay
                    paymentStatus: newPaymentStatus, // Mettre à jour le statut de paiement de la commande
                    // Assurez-vous que ces champs existent dans votre modèle Order
                }
            });

            // Créer ou mettre à jour l'entrée dans la table 'payments'
            // Assurez-vous que orderId est UNIQUE dans le modèle Payment pour une relation 1:1
            await prisma.payment.upsert({
                where: { orderId: orderReference },
                update: {
                    paymentMethod: 'Kakapay', // Ou le nom réel de la méthode de paiement si disponible
                    transactionId: kakapayTransactionId,
                    amount: paymentAmount,
                    currency: paymentCurrency,
                    status: newPaymentStatus,
                    paymentDate: new Date(), // Date actuelle du paiement
                },
                create: {
                    orderId: orderReference,
                    paymentMethod: 'Kakapay',
                    transactionId: kakapayTransactionId,
                    amount: paymentAmount,
                    currency: paymentCurrency,
                    status: newPaymentStatus,
                    paymentDate: new Date(),
                }
            });

        } else if (paymentStatusFromKakapay === 'FAILED' || paymentStatusFromKakapay === 'CANCELLED') {
            newOrderStatus = 'PAYMENT_FAILED';
            newPaymentStatus = 'FAILED'; // Ou 'REFUNDED' si pertinent pour CANCELLED
            console.log(`Paiement échoué/annulé confirmé par webhook pour la commande: ${orderReference}`);

            // Mise à jour du statut de la commande dans la DB
            await prisma.order.update({
                where: { id: orderReference },
                data: {
                    status: newOrderStatus,
                    kakapayTransactionId: kakapayTransactionId, // Enregistrer l'ID de transaction Kakapay
                    paymentStatus: newPaymentStatus,
                }
            });

            // Mettre à jour l'entrée dans la table 'payments' si elle existe
            await prisma.payment.updateMany({ // updateMany car orderId est unique mais on n'utilise pas findUnique ici
                where: { orderId: orderReference },
                data: {
                    transactionId: kakapayTransactionId,
                    status: newPaymentStatus,
                    paymentDate: new Date(),
                }
            });

        } else if (paymentStatusFromKakapay === 'PENDING') {
            newOrderStatus = 'PENDING';
            newPaymentStatus = 'PENDING';
            console.log(`Paiement en attente confirmé par webhook pour la commande: ${orderReference}`);

            // Mise à jour du statut de la commande dans la DB
            await prisma.order.update({
                where: { id: orderReference },
                data: {
                    status: newOrderStatus,
                    kakapayTransactionId: kakapayTransactionId,
                    paymentStatus: newPaymentStatus,
                }
            });

            // Mettre à jour l'entrée dans la table 'payments' si elle existe
            await prisma.payment.updateMany({
                where: { orderId: orderReference },
                data: {
                    transactionId: kakapayTransactionId,
                    status: newPaymentStatus,
                    paymentDate: new Date(),
                }
            });

        } else {
            console.log(`Statut de paiement intermédiaire ou inattendu (${paymentStatusFromKakapay}) pour la commande: ${orderReference}`);
            // Gérez les statuts intermédiaires si votre logique d'affaires l'exige.
            // Pour l'instant, nous renvoyons OK mais sans action sur la DB si le statut n'est pas géré explicitement.
        }

        // Il est crucial de renvoyer un statut 200 OK à Kakapay pour indiquer que le webhook a été reçu et traité.
        return NextResponse.json({ message: 'Webhook Kakapay reçu et traité avec succès' }, { status: 200 });

    } catch (error) {
        console.error('Erreur lors du traitement du webhook Kakapay:', error);
        // En cas d'erreur interne, renvoyez un 500 pour que Kakapay puisse potentiellement réessayer.
        return NextResponse.json({ message: 'Erreur interne du serveur lors du traitement du webhook.' }, { status: 500 });
    }
}

// Fonction de validation de signature (exemple - à adapter selon la doc Kakapay)
/*
function isValidKakapayWebhookSignature(payload, signatureHeader, secret) {
    // Implémentez la logique de vérification de signature fournie par Kakapay.
    // Cela implique généralement de hacher le payload avec le secret et de comparer le résultat avec l'en-tête signature.
    // Ex: crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
    return true; // À remplacer par la vraie logique
}
*/