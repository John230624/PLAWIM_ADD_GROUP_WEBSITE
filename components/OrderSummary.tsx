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
    const [showKakapayWidget, setShowKakapayWidget] = useState(false);
    const [transactionIdForKakapay, setTransactionIdForKakapay] = useState<string | null>(null);
    const [preparedOrderPayload, setPreparedOrderPayload] = useState<any>(null);
    const [isKkiapayWidgetApiReady, setIsKkiapayWidgetApiReady] = useState(false);

    const kkiapayApiCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const kkiapayOpenRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const totalAmountToPay = getCartCount() > 0 ? getCartAmount() + Math.floor(getCartAmount() * 0.02) : 0;
    const KAKAPAY_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_API_KEY;

    useEffect(() => {
        if (!loadingAddresses && userAddresses.length > 0) {
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

    const handleAddressSelect = async (address: Address) => {
        setSelectedAddress(address);
        setIsDropdownOpen(false);

        if (currentUser?.id && address.id) {
            try {
                const response = await axios.put(`${url}/api/addresses/${currentUser.id}`, {
                    ...address,
                    isDefault: true,
                }, {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.status === 200 && response.data.success) {
                    toast.success("Adresse par défaut définie avec succès !");
                    fetchUserAddresses();
                } else {
                    toast.error("Échec de la définition de l'adresse par défaut.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Erreur réseau lors de la définition de l'adresse.");
            }
        }
    };

    const createOrder = async () => {
        if (!selectedAddress) return toast.error("Veuillez sélectionner une adresse.");
        if (!currentUser?.id) return toast.error("Veuillez vous connecter.");
        if (getCartCount() === 0) return toast.error("Votre panier est vide.");
        if (!isKkiapayWidgetApiReady) return toast.info("Le module de paiement n'est pas prêt.");

        setIsLoading(true);
        toast.info("Préparation du paiement...");

        try {
            const { data } = await axios.get(`${url}/api/order/prepare-payment`);

            if (data?.success && data?.transactionId) {
                const orderItems = Object.entries(cartItems).map(([productId, quantity]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    return {
                        productId,
                        quantity: quantity as number,
                        price: product.offerPrice || product.price,
                        name: product.name,
                        imgUrl: product.imgUrl?.[0] || ''
                    };
                }).filter((item): item is MappedCartItem => item !== null);

                const fullOrderPayload = {
                    userId: currentUser.id,
                    items: orderItems,
                    totalAmount: totalAmountToPay,
                    shippingAddress: selectedAddress,
                    userEmail: currentUser.email || '',
                    userPhoneNumber: selectedAddress.phoneNumber,
                    currency,
                };

                setTransactionIdForKakapay(data.transactionId);
                setPreparedOrderPayload(fullOrderPayload);
                setShowKakapayWidget(true);
            } else {
                toast.error("Échec de la préparation de la commande.");
            }
        } catch (error) {
            toast.error("Erreur serveur lors de la préparation du paiement.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!showKakapayWidget || !transactionIdForKakapay || !preparedOrderPayload) return;

        const tryOpen = () => {
            if (typeof window.openKkiapayWidget !== 'function') return;

            window.openKkiapayWidget({
                amount: totalAmountToPay,
                api_key: KAKAPAY_PUBLIC_API_KEY!,
                callback: `${window.location.origin}/api/kkiapay-callback?transactionId=${transactionIdForKakapay}`,
                transaction_id: transactionIdForKakapay,
                email: currentUser?.email || '',
                phone: selectedAddress?.phoneNumber || '',
                position: 'center',
                sandbox: 'true',
                data: JSON.stringify(preparedOrderPayload)
            });

            window.addSuccessListener?.((response) => {
                router.push(`/order-status?orderId=${response.transactionId || transactionIdForKakapay}&status=success`);
            });

            window.addFailedListener?.((error) => {
                const msg = error.reason?.message || error.message || "Paiement échoué.";
                router.push(`/order-status?orderId=${transactionIdForKakapay}&status=failed&message=${encodeURIComponent(msg)}`);
            });

            setShowKakapayWidget(false);
        };

        tryOpen();
    }, [showKakapayWidget, transactionIdForKakapay, preparedOrderPayload]);

    return (
        <div className="w-full md:w-96 bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Résumé de la commande</h2>

            <div>
                <label className="block text-gray-600 font-medium mb-2">Sélectionnez une adresse</label>
                <div className="relative">
                    <button
                        className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 flex justify-between"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={loadingAddresses || isLoading}
                    >
                        <span>
                            {loadingAddresses
                                ? "Chargement..."
                                : selectedAddress
                                    ? `${selectedAddress.fullName}, ${selectedAddress.city}`
                                    : "Aucune adresse sélectionnée"}
                        </span>
                        <svg className={`w-5 h-5 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isDropdownOpen && (
                        <ul className="absolute z-10 mt-2 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {userAddresses.map((address: Address) => (
                                <li
                                    key={address.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleAddressSelect(address)}
                                >
                                    {address.fullName}, {address.city}, {address.state}
                                </li>
                            ))}
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
                disabled={getCartCount() === 0 || isLoading || !isKkiapayWidgetApiReady}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex justify-center"
            >
                {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Préparation du paiement...</>
                ) : "Procéder au Paiement"}
            </button>
        </div>
    );
};

export default OrderSummary;
