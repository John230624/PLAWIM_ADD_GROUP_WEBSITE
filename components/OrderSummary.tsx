'use client';

import React, { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios"; // Importer AxiosError pour un meilleur typage des erreurs
import { Loader2 } from 'lucide-react';

// Déclarations TypeScript pour les fonctions globales de Kkiapay
declare global {
    interface Window {
        openKkiapayWidget: (options: KkiapayOptions) => void;
        addSuccessListener: (callback: (response: KkiapaySuccessResponse) => void) => void;
        addFailedListener: (callback: (error: KkiapayErrorResponse) => void) => void;
        // Kkiapay ne fournit généralement pas de méthodes removeListener
        // Si ces méthodes existaient, elles devraient être définies ici.
    }
}

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

interface Address {
    id: string;
    fullName: string;
    phoneNumber: string;
    pincode: string;
    area: string;
    city: string;
    state: string;
    isDefault: boolean;
    userId: string;
    country?: string; // Ajouter si votre backend l'utilise
    addressLine1?: string; // Ajouter si votre backend l'utilise
    addressLine2?: string; // Ajouter si votre backend l'utilise
}

interface Product {
    id: string;
    name: string;
    price: number;
    offerPrice?: number;
    imgUrl?: string[];
}

interface MappedCartItem {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    imgUrl: string;
}

// Type pour le payload de commande envoyé au backend et potentiellement à Kkiapay `data`
interface OrderPayload {
    userId: string;
    items: MappedCartItem[];
    totalAmount: number;
    shippingAddress: { // Structure exacte attendue par votre backend
        fullName: string;
        phoneNumber: string;
        area: string;
        city: string;
        state: string;
        pincode: string;
        country?: string;
        addressLine1?: string;
        addressLine2?: string;
    };
    userEmail: string;
    userPhoneNumber: string;
    currency: string;
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

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showKkiapayWidget, setShowKkiapayWidget] = useState(false);
    const [transactionIdForKkiapay, setTransactionIdForKkiapay] = useState<string | null>(null);
    const [preparedOrderPayload, setPreparedOrderPayload] = useState<OrderPayload | null>(null);
    const [isKkiapayWidgetApiReady, setIsKkiapayWidgetApiReady] = useState(false);

    const kkiapayApiCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calcul du montant total à payer incluant 2% de frais
    const totalAmountToPay = getCartCount() > 0 ? getCartAmount() + Math.floor(getCartAmount() * 0.02) : 0;
    const KKIAPAY_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_API_KEY;

    useEffect(() => {
        if (!loadingAddresses && userAddresses.length > 0) {
            // Typage explicite de 'addr' en Address
            const defaultAddress = userAddresses.find((addr: Address) => addr.isDefault) || userAddresses[0];
            setSelectedAddress(defaultAddress);
        } else if (!loadingAddresses && userAddresses.length === 0) {
            setSelectedAddress(null);
        }
    }, [userAddresses, loadingAddresses]);

    useEffect(() => {
        const checkApiReady = () => {
            return typeof window !== 'undefined' &&
                typeof window.openKkiapayWidget === 'function' &&
                typeof window.addSuccessListener === 'function' &&
                typeof window.addFailedListener === 'function';
        };

        if (checkApiReady()) {
            setIsKkiapayWidgetApiReady(true);
            return;
        }

        kkiapayApiCheckIntervalRef.current = setInterval(() => {
            if (checkApiReady()) {
                setIsKkiapayWidgetApiReady(true);
                clearInterval(kkiapayApiCheckIntervalRef.current!);
            }
        }, 100);

        return () => {
            if (kkiapayApiCheckIntervalRef.current) clearInterval(kkiapayApiCheckIntervalRef.current);
        };
    }, []);

    const handleAddressSelect = async (address: Address) => { // Typage explicite de 'address'
        setSelectedAddress(address);
        setIsDropdownOpen(false);

        if (currentUser?.id && address.id) {
            try {
                const addressToUpdate = {
                    ...address,
                    isDefault: true,
                };
                const response = await axios.put(`${url}/api/addresses/${currentUser.id}`, addressToUpdate, {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.status === 200 && response.data.success) {
                    toast.success("Adresse par défaut définie avec succès !");
                    fetchUserAddresses();
                } else {
                    toast.error("Échec de la définition de l'adresse par défaut.");
                }
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'adresse par défaut:", error);
                toast.error("Erreur réseau ou serveur lors de la mise à jour de l'adresse.");
            }
        }
    };

    const createOrder = async () => {
        if (!selectedAddress) {
            toast.error("Veuillez sélectionner une adresse de livraison.");
            return;
        }
        if (!currentUser?.id) {
            toast.error("Veuillez vous connecter pour passer commande.");
            router.push("/login");
            return;
        }
        if (getCartCount() === 0) {
            toast.error("Votre panier est vide. Veuillez ajouter des articles avant de commander.");
            return;
        }
        if (!isKkiapayWidgetApiReady) {
            toast.info("Le module de paiement n'est pas prêt. Veuillez patienter un instant.");
            return;
        }
        if (!KKIAPAY_PUBLIC_API_KEY) {
            toast.error("La clé API publique Kkiapay n'est pas configurée.");
            console.error("Erreur: NEXT_PUBLIC_KKIAPAY_PUBLIC_API_KEY n'est pas défini.");
            return;
        }

        setIsLoading(true);
        toast.info("Préparation du paiement...", { autoClose: 2000 });

        try {
            // Typage précis de la réponse de l'API de préparation de paiement
            const { data: prepareResponseData } = await axios.get<{ success: boolean; transactionId?: string; message?: string }>(`${url}/api/order/prepare-payment`);

            if (prepareResponseData?.success && prepareResponseData?.transactionId) {
                const orderItems: MappedCartItem[] = Object.entries(cartItems).map(([productId, quantity]) => {
                    // Typage explicite de 'p' en Product
                    const product = (products as Product[]).find((p: Product) => p.id === productId);
                    if (!product) {
                        console.warn(`Produit avec l'ID ${productId} non trouvé dans la liste des produits.`);
                        return null;
                    }

                    const itemImgUrl = (product.imgUrl && product.imgUrl.length > 0) ? product.imgUrl[0] : '/placeholder-product.png';

                    return {
                        productId,
                        quantity: quantity as number,
                        price: product.offerPrice !== undefined ? product.offerPrice : product.price,
                        name: product.name,
                        imgUrl: itemImgUrl,
                    };
                }).filter((item): item is MappedCartItem => item !== null); // Assure le bon type après le filtre

                if (orderItems.length === 0) {
                    toast.error("Votre panier est vide ou contient des articles invalides après vérification.");
                    setIsLoading(false);
                    return;
                }

                // Formatage du numéro de téléphone pour Kkiapay (retirer le '+' si présent)
                // C'est crucial pour l'erreur "Le numéro n'est pas valide"
                const phoneNumberForKkiapay = selectedAddress.phoneNumber.replace(/^\+/, '');

                const fullOrderPayload: OrderPayload = {
                    userId: currentUser.id,
                    items: orderItems,
                    totalAmount: totalAmountToPay,
                    // S'assurer que shippingAddress correspond au type défini dans OrderPayload
                    shippingAddress: {
                        fullName: selectedAddress.fullName,
                        phoneNumber: phoneNumberForKkiapay,
                        area: selectedAddress.area,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        pincode: selectedAddress.pincode,
                        country: selectedAddress.country, // Assurez-vous que ces champs existent sur `selectedAddress` si utilisés
                        addressLine1: selectedAddress.addressLine1,
                        addressLine2: selectedAddress.addressLine2,
                    },
                    userEmail: currentUser.email || '',
                    userPhoneNumber: phoneNumberForKkiapay, // Utiliser le numéro formaté ici aussi
                    currency,
                };

                setTransactionIdForKkiapay(prepareResponseData.transactionId);
                setPreparedOrderPayload(fullOrderPayload);
                setShowKkiapayWidget(true);

            } else {
                // Utiliser prepareResponseData?.message pour un accès sécurisé
                const errorMessage = prepareResponseData?.message || "L'API de préparation de paiement n'a pas renvoyé d'ID de transaction.";
                toast.error(`Échec de la préparation de la commande : ${errorMessage}`);
                console.error("Erreur API prepare-payment:", prepareResponseData);
            }
        } catch (error) { // Typage plus général pour la capture d'erreur
            console.error("Erreur lors de la commande (bloc catch):", error);
            let msg = "Une erreur inconnue est survenue lors de la commande.";
            if (axios.isAxiosError(error)) { // Vérifier si c'est une erreur Axios
                msg = error.response?.data?.message || error.message;
            } else if (error instanceof Error) { // Vérifier si c'est une erreur standard
                msg = error.message;
            }
            toast.error(`Erreur : ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!showKkiapayWidget || !transactionIdForKkiapay || !preparedOrderPayload || !isKkiapayWidgetApiReady || !selectedAddress) {
            return;
        }

        const openWidget = () => {
            if (!KKIAPAY_PUBLIC_API_KEY) {
                console.error("Erreur: KKIAPAY_PUBLIC_API_KEY est manquant. Impossible d'ouvrir le widget Kkiapay.");
                toast.error("Problème de configuration du paiement. Contactez le support.");
                setShowKkiapayWidget(false);
                return;
            }

            // Assurez-vous que selectedAddress n'est pas null ici pour accéder à phoneNumber
            const phoneNumberForKkiapay = selectedAddress.phoneNumber.replace(/^\+/, '');

            window.openKkiapayWidget({
                amount: totalAmountToPay,
                api_key: KKIAPAY_PUBLIC_API_KEY,
                callback: `${window.location.origin}/api/kkiapay-callback?transactionId=${transactionIdForKkiapay}`,
                transaction_id: transactionIdForKkiapay,
                email: currentUser?.email || '',
                phone: phoneNumberForKkiapay, // Utilisation du numéro formaté
                position: 'center',
                sandbox: 'true', // 'true' pour le mode test, 'false' pour la production
                data: JSON.stringify(preparedOrderPayload)
            });

            // Les listeners Kkiapay sont ajoutés globalement par le script Kkiapay.
            // Il n'y a généralement pas de fonctions 'removeListener' fournies par Kkiapay.
            // Les callbacks resteront actifs. Si la gestion des écouteurs doit être plus fine,
            // il faudrait une logique pour éviter des déclenchements multiples si le composant se re-monte.
            // Pour l'instant, on assume un seul paiement par montage de composant.

            window.addSuccessListener?.((response) => {
                router.push(`/order-status?orderId=${response.transactionId || transactionIdForKkiapay}&status=success`);
            });

            window.addFailedListener?.((error) => {
                const msg = error.reason?.message || error.message || "Paiement échoué ou annulé.";
                router.push(`/order-status?orderId=${transactionIdForKkiapay}&status=failed&message=${encodeURIComponent(msg)}`);
            });

            setShowKkiapayWidget(false); // Réinitialiser pour éviter les ouvertures multiples
        };

        openWidget();

        // Retourne une fonction de nettoyage vide car kkiapayOpenRetryTimeoutRef a été supprimé
        return () => {};

    }, [showKkiapayWidget, transactionIdForKkiapay, preparedOrderPayload, isKkiapayWidgetApiReady, selectedAddress, currentUser?.email, totalAmountToPay, KKIAPAY_PUBLIC_API_KEY, router]);

    return (
        <div className="w-full md:w-96 bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Résumé de la commande</h2>

            <div>
                <label className="block text-gray-600 font-medium mb-2">Sélectionnez une adresse</label>
                <div className="relative">
                    <button
                        className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 flex justify-between items-center"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={loadingAddresses || isLoading}
                    >
                        <span>
                            {loadingAddresses
                                ? "Chargement des adresses..."
                                : selectedAddress // Accès conditionnel pour éviter 'never'
                                    ? `${selectedAddress.fullName}, ${selectedAddress.city}`
                                    : "Aucune adresse sélectionnée"}
                        </span>
                        <svg className={`w-5 h-5 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isDropdownOpen && (
                        <ul className="absolute z-10 mt-2 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {userAddresses.length === 0 && !loadingAddresses ? (
                                <li className="px-4 py-2 text-gray-500 text-center">Aucune adresse disponible.</li>
                            ) : (
                                userAddresses.map((address: Address) => ( // Typage explicite de 'address'
                                    <li
                                        key={address.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleAddressSelect(address)}
                                    >
                                        {address.fullName}, {address.city}, {address.state}
                                    </li>
                                ))
                            )}
                            <li
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 text-center border-t mt-1 cursor-pointer"
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
                <div className="flex justify-between font-semibold border-t pt-4">
                    <span>Total à payer</span>
                    <span>{formatPriceInFCFA(totalAmountToPay)}</span>
                </div>
            </div>

            <button
                onClick={createOrder}
                disabled={getCartCount() === 0 || isLoading || !isKkiapayWidgetApiReady || !selectedAddress || loadingAddresses}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex justify-center items-center"
            >
                {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Préparation du paiement...</>
                ) : "Procéder au Paiement"}
            </button>
        </div>
    );
};

export default OrderSummary;