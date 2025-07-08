'use client';

import React, { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader2 } from 'lucide-react';

// Déclarations TypeScript pour les fonctions globales de Kkiapay
declare global {
  interface Window {
    openKkiapayWidget: (options: KkiapayOptions) => void;
    addSuccessListener: (callback: (response: KkiapaySuccessResponse) => void) => void;
    addFailedListener: (callback: (error: KkiapayErrorResponse) => void) => void;
  }
}

// Interfaces pour les options et réponses de Kkiapay
interface KkiapayOptions {
  amount: number;
  api_key: string;
  callback?: string;
  transaction_id?: string;
  email?: string;
  phone?: string;
  position?: "left" | "right" | "center";
  sandbox?: "true" | "false" | boolean;
  data?: string; 
  theme?: string;
  paymentmethod?: "momo" | "card";
  name?: string;
}

interface KkiapaySuccessResponse {
  transactionId: string;
  data?: string; 
}

interface KkiapayErrorReason {
  code?: string;
  message?: string;
}

interface KkiapayErrorResponse {
  transactionId?: string; 
  reason?: KkiapayErrorReason;
  message?: string;
}


const OrderSummary = () => {
    const {
        currency,
        router,
        getCartCount,
        getCartAmount,
        currentUser, 
        userAddresses,
        loadingAddresses,
        fetchUserAddresses,
        url,
        products,
        cartItems,
        formatPriceInFCFA,
    } = useAppContext();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showKakapayWidget, setShowKakapayWidget] = useState(false);
    const [transactionIdForKakapay, setTransactionIdForKakapay] = useState<string | null>(null);
    const [preparedOrderPayload, setPreparedOrderPayload] = useState<any>(null); 

    const [isKkiapayWidgetApiReady, setIsKkiapayWidgetApiReady] = useState(false);
    const kkiapayApiCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const kkiapayOpenRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const totalAmountToPay = getCartCount() > 0 ? getCartAmount() + Math.floor(getCartAmount() * 0.02) : 0;
    const KAKAPAY_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KAKAPAY_PUBLIC_API_KEY;

    useEffect(() => {
        if (!loadingAddresses && userAddresses.length > 0) {
            const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
            setSelectedAddress(defaultAddress);
        } else if (!loadingAddresses && userAddresses.length === 0) {
            setSelectedAddress(null);
        }
    }, [userAddresses, loadingAddresses]);

    useEffect(() => {
        if (kkiapayApiCheckIntervalRef.current) {
            clearInterval(kkiapayApiCheckIntervalRef.current);
            kkiapayApiCheckIntervalRef.current = null;
        }

        const checkKkiapayApiFullAvailability = () => {
            return typeof window !== "undefined" &&
                   typeof window.openKkiapayWidget === 'function' &&
                   typeof window.addSuccessListener === 'function' &&
                   typeof window.addFailedListener === 'function';
        };

        if (checkKkiapayApiFullAvailability()) {
            console.log('API openKkiapayWidget et les écouteurs sont immédiatement disponibles !');
            setIsKkiapayWidgetApiReady(true);
            return;
        }

        console.log("Démarrage du sondage pour la disponibilité de l'API Kkiapay...");
        kkiapayApiCheckIntervalRef.current = setInterval(() => {
            if (checkKkiapayApiFullAvailability()) {
                console.log('API openKkiapayWidget et les écouteurs sont maintenant disponibles ! Activation du bouton.');
                setIsKkiapayWidgetApiReady(true);
                if (kkiapayApiCheckIntervalRef.current) {
                    clearInterval(kkiapayApiCheckIntervalRef.current);
                    kkiapayApiCheckIntervalRef.current = null;
                }
            } else {
                console.log('API Kkiapay (openKkiapayWidget / addSuccessListener / addFailedListener) non encore disponible, attente en cours...');
            }
        }, 100); 

        return () => {
            if (kkiapayApiCheckIntervalRef.current) {
                clearInterval(kkiapayApiCheckIntervalRef.current);
                kkiapayApiCheckIntervalRef.current = null;
            }
            console.log('Sondage de l\'API Kkiapay arrêté.');
        };
    }, []); 


    const handleAddressSelect = async (address: any) => {
        setSelectedAddress(address);
        setIsDropdownOpen(false);

        if (currentUser && currentUser.id && address.id) {
            try {
                const headers = { 'Content-Type': 'application/json' }; 

                const response = await axios.put(
                    `${url}/api/addresses/${currentUser.id}`,
                    {
                        id: address.id,
                        fullName: address.fullName,
                        phoneNumber: address.phoneNumber,
                        pincode: address.pincode,
                        area: address.area,
                        city: address.city,
                        state: address.state,
                        isDefault: true 
                    },
                    { headers }
                );

                if (response.status === 200 && response.data.success) {
                    toast.success("Adresse par défaut définie avec succès !");
                    fetchUserAddresses(); 
                } else {
                    toast.error(`Échec de la définition de l'adresse par défaut: ${response.data.message || 'Erreur inconnue.'}`);
                }
            } catch (error) {
                console.error("Erreur setting default address:", error);
                toast.error(`Erreur réseau lors de la définition de l'adresse par défaut.`);
            }
        }
    };

    const createOrder = async () => {
        if (!selectedAddress) {
            toast.error("Veuillez sélectionner ou ajouter une adresse de livraison pour continuer.");
            return;
        }

        if (!currentUser || !currentUser.id) { 
            toast.error("Veuillez vous connecter pour passer commande.");
            router.push('/login');
            return;
        }

        if (getCartCount() === 0) {
            toast.error("Votre panier est vide.");
            return;
        }

        if (!isKkiapayWidgetApiReady) {
            toast.info("Le module de paiement n'est pas encore prêt. Veuillez patienter un instant et réessayer.");
            console.log("API openKkiapayWidget non prête. Clic du bouton bloqué.");
            return;
        }

        setIsLoading(true);
        toast.info("Préparation du paiement Kkiapay...");

        try {
            // Étape 1: Obtenir un transactionId du backend (en utilisant GET)
            console.log("Appel à /api/order/prepare-payment pour obtenir un transactionId (GET)...");
            // CORRECTION ICI: Utilisation de axios.get
            const prepareResponse = await axios.get(`${url}/api/order/prepare-payment`); 
            
            if (prepareResponse.status === 200 && prepareResponse.data.success && prepareResponse.data.transactionId) {
                const newTransactionId = prepareResponse.data.transactionId;
                setTransactionIdForKakapay(newTransactionId);
                console.log("Transaction ID reçu de l'API:", newTransactionId);

                // Construire le payload complet de la commande à envoyer à Kkiapay
                const orderItems = Object.entries(cartItems).map(([productId, quantity]) => {
                    const product = products.find(p => String(p.id) === String(productId));
                    if (!product) {
                        console.warn(`Produit avec ID ${productId} non trouvé dans la liste des produits.`);
                        return null;
                    }
                    return {
                        productId: productId,
                        quantity: quantity,
                        price: product.offerPrice || product.price,
                        name: product.name,
                        imgUrl: product.imgUrl && product.imgUrl[0] ? product.imgUrl[0] : ''
                    };
                }).filter(item => item !== null && item.productId && item.quantity > 0 && item.price >= 0);

                if (orderItems.length === 0) {
                    toast.error("Le panier ne contient pas d'articles valides pour la commande.");
                    setIsLoading(false);
                    return;
                }

                const fullOrderPayload = {
                    userId: currentUser.id, 
                    items: orderItems,
                    totalAmount: totalAmountToPay,
                    shippingAddress: selectedAddress,
                    userEmail: currentUser.email || '',
                    userPhoneNumber: selectedAddress?.phoneNumber || '',
                    currency: currency
                };
                setPreparedOrderPayload(fullOrderPayload); // Stocker le payload

                toast.success("Commande préparée ! Tentative d'ouverture du paiement Kkiapay...");
                setShowKakapayWidget(true); // Déclenche l'ouverture du widget dans l'useEffect suivant

            } else {
                console.error("L'API prepare-payment a échoué ou n'a pas renvoyé de transactionId.", prepareResponse.data);
                toast.error(`Erreur lors de la préparation de la commande: ${prepareResponse.data.message || 'Erreur inconnue.'}`);
            }
        } catch (error) {
            console.error("Erreur lors de la préparation de la commande Kkiapay (bloc catch):", error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(`Erreur serveur: ${error.response.data.message || 'Impossible de préparer la commande.'}`);
            } else {
                toast.error("Erreur inattendue lors de la commande.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Effet pour initier l'ouverture du widget Kkiapay (approche JS directe)
    useEffect(() => {
        if (kkiapayOpenRetryTimeoutRef.current) {
            clearTimeout(kkiapayOpenRetryTimeoutRef.current);
            kkiapayOpenRetryTimeoutRef.current = null;
        }

        // Ouvrir le widget seulement si showKakapayWidget est true, transactionId est là, ET le payload est prêt
        if (showKakapayWidget && transactionIdForKakapay && preparedOrderPayload) {
            console.log("Conditions showKakapayWidget, transactionIdForKakapay et preparedOrderPayload remplies. Déclenchement de la logique d'ouverture...");

            let retryCount = 0;
            const maxRetries = 60; 
            const retryDelay = 100; 

            const tryOpenKkiapayWidget = () => {
                if (typeof window.openKkiapayWidget === 'function') {
                    console.log("openKkiapayWidget() est ENFIN disponible. Ouverture du widget !");
                    window.openKkiapayWidget({
                        amount: totalAmountToPay,
                        api_key: KAKAPAY_PUBLIC_API_KEY as string,
                        callback: `${window.location.origin}/api/kkiapay-callback?transactionId=${transactionIdForKakapay}`,
                        transaction_id: transactionIdForKakapay,
                        email: currentUser?.email || '',
                        phone: selectedAddress?.phoneNumber || '',
                        position: "center",
                        sandbox: "true",
                        data: JSON.stringify(preparedOrderPayload) // ENVOI DU PAYLOAD COMPLET À KKIAY
                    });

                    if (typeof window.addSuccessListener === 'function') {
                        window.addSuccessListener((response: KkiapaySuccessResponse) => {
                            console.log("Paiement Kkiapay succès via addSuccessListener:", response);
                            setShowKakapayWidget(false); 
                            router.push(`/order-status?orderId=${response.transactionId || transactionIdForKakapay}&status=success`);
                        });
                    } else {
                        console.warn("addSuccessListener non trouvé. Les événements de succès ne seront pas capturés.");
                    }

                    if (typeof window.addFailedListener === 'function') {
                        window.addFailedListener((error: KkiapayErrorResponse) => {
                            const errorMessage = error.reason?.message || error.message || "Le paiement a échoué ou a été annulé.";
                            console.warn("Paiement Kkiapay échec via addFailedListener:", error);
                            setShowKakapayWidget(false); 
                            router.push(`/order-status?orderId=${transactionIdForKakapay}&status=failed&message=${encodeURIComponent(errorMessage)}`);
                        });
                    } else {
                        console.warn("addFailedListener non trouvé. Les événements d'échec ne seront pas capturés.");
                    }

                } else {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.warn(`openKkiapayWidget() n'est pas encore disponible. Nouvelle tentative (${retryCount}/${maxRetries})...`);
                        kkiapayOpenRetryTimeoutRef.current = setTimeout(tryOpenKkiapayWidget, retryDelay);
                    } else {
                        console.error("CRITIQUE FINALE : openKkiapayWidget() n'est pas devenu disponible après de multiples tentatives. Le widget ne peut pas s'ouvrir. Problème d'initialisation de l'API JavaScript Kkiapay.");
                        toast.error("Erreur critique : Le module de paiement n'est pas utilisable. Veuillez contacter le support technique de Kkiapay.");
                        setShowKakapayWidget(false);
                    }
                }
            };

            tryOpenKkiapayWidget();

        } else if (showKakapayWidget && !transactionIdForKakapay) {
            console.log("Le widget Kkiapay ne peut pas s'ouvrir : ID de transaction manquant (log dans showKakapayWidget useEffect).", { showKakapayWidget, transactionIdForKakapay });
        } else if (showKakapayWidget && !preparedOrderPayload) {
            console.log("Le widget Kkiapay ne peut pas s'ouvrir : Payload de commande non préparé.", { showKakapayWidget, preparedOrderPayload });
        }


        return () => {
            if (kkiapayOpenRetryTimeoutRef.current) {
                clearTimeout(kkiapayOpenRetryTimeoutRef.current);
                kkiapayOpenRetryTimeoutRef.current = null;
            }
        };
    }, [showKakapayWidget, transactionIdForKakapay, preparedOrderPayload, totalAmountToPay, currentUser, selectedAddress, KAKAPAY_PUBLIC_API_KEY, currency, router]);


    const isButtonDisabled = getCartCount() === 0 || isLoading || !isKkiapayWidgetApiReady;

    console.log("--- État du composant OrderSummary ---");
    console.log("selectedAddress:", selectedAddress);
    console.log("getCartCount():", getCartCount());
    console.log("isLoading (état local):", isLoading);
    console.log("isKkiapayWidgetApiReady (état local - CLÉ pour activer le bouton):", isKkiapayWidgetApiReady); 
    console.log("isButtonDisabled (calculé):", isButtonDisabled);
    console.log("Transaction ID for Kkiapay (état local):", transactionIdForKakapay); 
    console.log("Prepared Order Payload (état local):", preparedOrderPayload); 
    console.log("Current user:", currentUser);
    console.log("User Addresses:", userAddresses);
    console.log("Cart Items:", cartItems);
    console.log("Products (sample):", products.length > 0 ? products.slice(0, 2) : "No products loaded");
    console.log("-----------------------------------");

    return (
        <div className="w-full md:w-96 bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
                Résume de la commande
            </h2>

            <div>
                <label className="block text-gray-600 font-medium mb-2">
                    Sélectionnez une adresse
                </label>
                <div className="relative">
                    <button
                        className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-700 focus:outline-none hover:bg-gray-100 flex justify-between items-center"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={loadingAddresses || isLoading}
                    >
                        <span>
                            {loadingAddresses
                                ? "Chargement des adresses..."
                                : selectedAddress
                                    ? `${selectedAddress.fullName}, ${selectedAddress.city}`
                                    : "Veuillez sélectionner une adresse"}
                        </span>
                        <svg
                            className={`w-5 h-5 ml-2 inline transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <ul className="absolute mt-2 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                            {userAddresses.length > 0 ? (
                                userAddresses.map((address) => (
                                    <li
                                        key={address.id || address._id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleAddressSelect(address)}
                                    >
                                        {address.fullName}, {address.area}, {address.city}, {address.state}
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-2 text-gray-500 text-center">Aucune adresse trouvée.</li>
                            )}
                            <li
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-gray-100 cursor-pointer text-center border-t mt-1 pt-1"
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    router.push("/add-address");
                                }}
                            >
                                + Ajouter une nouvelle adresse
                            </li>
                        </ul>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between text-gray-700">
                    <span>Articles ({getCartCount()})</span>
                    <span>{formatPriceInFCFA(getCartAmount())}</span>
                </div>

                <div className="flex justify-between text-gray-700 font-semibold border-t pt-4">
                    <span>Total à payer</span>
                    <span>{formatPriceInFCFA(totalAmountToPay)}</span>
                </div>
            </div>

            <button
                onClick={createOrder}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                disabled={isButtonDisabled}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Préparation du paiement...
                    </>
                ) : (
                    "Procéder au Paiement"
                )}
            </button>

            {/* La modale de statut de commande est maintenant gérée par la page /order-status */}
        </div>
    );
};

export default OrderSummary;
