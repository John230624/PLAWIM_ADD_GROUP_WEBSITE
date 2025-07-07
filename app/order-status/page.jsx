"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

const OrderStatusPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { loadCartData, fetchUserOrders } = useAppContext();

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Vérification du statut de votre paiement...');
    const [transactionId, setTransactionId] = useState(null);
    const [orderRef, setOrderRef] = useState(null);

    useEffect(() => {
        const receivedStatus = searchParams.get('status');
        const receivedOrderId = searchParams.get('orderId');
        const receivedMessage = searchParams.get('message');
        const kkiapayTransactionIdParam = searchParams.get('transaction_id');

        setTransactionId(kkiapayTransactionIdParam || receivedOrderId);
        setOrderRef(receivedOrderId);

        if (receivedStatus === 'success') {
            setStatus('success');
            setMessage('Paiement réussi ! Votre commande est en cours de traitement et votre panier a été vidé.');
            loadCartData();
            fetchUserOrders();
        } else if (receivedStatus === 'failed') {
            setStatus('failed');
            setMessage(`Le paiement a échoué ou a été annulé. ${receivedMessage || 'Veuillez réessayer.'}`);
        } else if (receivedStatus === 'error') {
            setStatus('failed');
            setMessage(`Une erreur est survenue lors du traitement de votre commande. ${receivedMessage || 'Veuillez réessayer plus tard.'}`);
        } else {
            setStatus('pending');
            setMessage('Statut de paiement incertain. Nous vérifions votre commande. Veuillez patienter ou vérifier votre historique de commandes.');
        }
    }, [searchParams, loadCartData, fetchUserOrders]);

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-6">
                {status === 'loading' && (
                    <Loader2 className="mx-auto h-20 w-20 text-indigo-500 animate-spin" />
                )}
                {status === 'success' && (
                    <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
                )}
                {status === 'failed' && (
                    <XCircle className="mx-auto h-20 w-20 text-red-500" />
                )}
                {status === 'pending' && (
                    <Loader2 className="mx-auto h-20 w-20 text-yellow-400 animate-spin" />
                )}

                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Statut de la Commande
                </h1>
                <p className="text-gray-700 text-lg leading-relaxed">{message}</p>

                {orderRef && (
                    <p className="text-sm text-gray-400 font-mono select-text break-all">
                        <span className="font-semibold">Référence :</span> {orderRef}
                    </p>
                )}
                {transactionId && (
                    <p className="text-sm text-gray-400 font-mono select-text break-all">
                        <span className="font-semibold">Transaction Kkiapay :</span> {transactionId}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                    <Link
                        href="/my-orders"
                        className="inline-block w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-3 shadow-md transition"
                    >
                        Voir mes commandes
                    </Link>
                    {status === 'failed' && (
                        <Link
                            href="/cart"
                            className="inline-block w-full sm:w-auto text-indigo-600 hover:underline font-semibold rounded-xl px-6 py-3 border border-indigo-600 transition"
                        >
                            Retourner au panier
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderStatusPage;
