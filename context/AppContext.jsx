// context/AppContext.jsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

const AppContext = createContext();

const formatPriceInFCFA = (price) => {
    if (typeof price !== 'number') {
        price = parseFloat(price);
    }
    if (isNaN(price)) {
        return "N/A";
    }
    return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XOF' }).format(price);
};

export const AppProvider = ({ children }) => {
    const router = useRouter();
    const { data: session, status } = useSession(); 

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [loadingCart, setLoadingCart] = useState(true); 
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [userOrders, setUserOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true); 
    const [userAddresses, setUserAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true); 
    const [currency, setCurrency] = useState('XOF'); 
    const [deliveryFee, setDeliveryFee] = useState(0);

    const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        setErrorProducts(null);
        try {
            const response = await axios.get(`${url}/api/products`);
            if (response.status === 200 && Array.isArray(response.data)) {
                const apiProducts = response.data.map(product => {
                    let parsedImgUrls = [];
                    if (product.imgUrl) {
                        try {
                            const parsed = JSON.parse(product.imgUrl);
                            parsedImgUrls = Array.isArray(parsed) ? parsed : [parsed];
                        } catch {
                            parsedImgUrls = [product.imgUrl];
                        }
                    }
                    return {
                        ...product,
                        id: product.id,
                        imgUrl: parsedImgUrls,
                        price: parseFloat(product.price),
                        offerPrice: product.offerPrice ? parseFloat(product.offerPrice) : null,
                        rating: product.rating || 4.5,
                        category: product.category || 'Non classé',
                        stock: product.stock || 0,
                        description: product.description || 'Description non disponible',
                    };
                });
                setProducts(apiProducts);
            } else {
                setErrorProducts("Format de données de produits inattendu ou API indisponible.");
                toast.error("Format de données de produits inattendu ou API indisponible.");
                setProducts([]);
            }
        } catch (error) {
            console.error("Erreur API produits:", error);
            setErrorProducts("Erreur de chargement des produits. Vérifiez votre connexion à la base de données.");
            toast.error("Erreur de chargement des produits.");
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [url]);

    const loadCartData = useCallback(async () => {
        if (!isLoggedIn || !currentUser?.id) {
            const savedCart = localStorage.getItem('cartItems');
            setCartItems(savedCart ? JSON.parse(savedCart) : {});
            setLoadingCart(false);
            return;
        }
        setLoadingCart(true);
        try {
            const response = await axios.get(`${url}/api/cart/${currentUser.id}`);
            if (response.status === 200) { 
                const cartData = {};
                if (Array.isArray(response.data)) {
                    response.data.forEach(item => {
                        if (item.productId && item.quantity) {
                            cartData[item.productId] = item.quantity;
                        }
                    });
                } else {
                    console.warn("La réponse de l'API /api/cart/[userId] n'est pas un tableau:", response.data);
                    toast.error("Format de données de panier inattendu.");
                }
                setCartItems(cartData);
            } else {
                toast.error(`Échec du chargement du panier: ${response.status}`);
            }
        } catch (error) {
            console.error("Erreur chargement panier:", error);
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.info("Session expirée, veuillez vous reconnecter.");
                    if (isLoggedIn) router.push('/login'); 
                } else if (error.response.status === 404) {
                     toast.error("Endpoint du panier non trouvé. Veuillez vérifier la route API.");
                }
            } else {
                toast.error("Erreur lors du chargement du panier. Veuillez réessayer.");
            }
        } finally {
            setLoadingCart(false);
        }
    }, [url, isLoggedIn, currentUser?.id, router]);

    const addToCart = useCallback(async (productId) => {
        if (!isLoggedIn || !currentUser?.id) {
            toast.info("Connectez-vous pour ajouter au panier.");
            router.push('/login');
            return;
        }
        setCartItems(prev => {
            const newCart = { ...prev, [productId]: (prev[productId] || 0) + 1 };
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            return newCart;
        });
        try {
            await axios.post(
                `${url}/api/cart/${currentUser.id}`,
                { productId, quantity: 1 } 
            );
            toast.success("Produit ajouté au panier.");
        } catch (error) {
            console.error("Erreur ajout panier:", error);
            setCartItems(prev => {
                const newCart = { ...prev };
                if (newCart[productId] <= 1) {
                    delete newCart[productId];
                } else {
                    newCart[productId] -= 1;
                }
                localStorage.setItem('cartItems', JSON.stringify(newCart));
                return newCart;
            });
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.info("Session expirée, veuillez vous reconnecter.");
                    router.push('/login');
                } else if (error.response.status === 404) {
                    toast.error("Endpoint ou produit non trouvé pour l'ajout au panier.");
                } else {
                    toast.error("Erreur lors de l'ajout au panier.");
                }
            } else {
                toast.error("Erreur inattendue lors de l'ajout au panier.");
            }
        }
    }, [url, isLoggedIn, currentUser?.id, router]);

    const removeFromCart = useCallback(async (productId) => {
        const oldQuantity = cartItems[productId] || 0;
        if (oldQuantity === 0) return;
        setCartItems(prev => {
            const newCart = { ...prev };
            if (newCart[productId] > 1) {
                newCart[productId] -= 1;
            } else {
                delete newCart[productId];
            }
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            return newCart;
        });
        if (isLoggedIn && currentUser?.id) {
            try {
                await axios.put(
                    `${url}/api/cart/${currentUser.id}`,
                    { productId, quantity: oldQuantity - 1 } 
                );
                toast.info("Quantité du produit ajustée.");
            } catch (error) {
                console.error("Erreur retrait panier:", error);
                toast.error("Erreur lors de la mise à jour du panier.");
                setCartItems(prev => ({ 
                    ...prev,
                    [productId]: oldQuantity
                }));
                if (axios.isAxiosError(error) && error.response) {
                    if (error.response.status === 401 || error.response.status === 403) {
                        toast.info("Session expirée, veuillez vous reconnecter.");
                        router.push('/login');
                    }
                }
            }
        }
    }, [url, isLoggedIn, currentUser?.id, router, cartItems]);

    const deleteFromCart = useCallback(async (productId) => {
        const oldQuantity = cartItems[productId];
        setCartItems(prev => {
            const newCart = { ...prev };
            delete newCart[productId];
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            return newCart;
        });
        if (isLoggedIn && currentUser?.id) {
            try {
                await axios.delete(`${url}/api/cart/${currentUser.id}`, {
                    data: { productId } 
                });
                toast.success("Produit retiré du panier.");
            } catch (error) {
                console.error("Erreur suppression panier:", error);
                toast.error("Erreur lors de la suppression du panier.");
                setCartItems(prev => ({ 
                    ...prev,
                    [productId]: oldQuantity
                }));
                if (axios.isAxiosError(error) && error.response) {
                    if (error.response.status === 401 || error.response.status === 403) {
                        toast.info("Session expirée, veuillez vous reconnecter.");
                        router.push('/login');
                    }
                }
            }
        }
    }, [url, isLoggedIn, currentUser?.id, router, cartItems]);

    const updateCartQuantity = useCallback(async (productId, quantity) => {
        const oldQuantity = cartItems[productId] || 0;
        setCartItems(prev => {
            const newCart = { ...prev };
            if (quantity <= 0) {
                delete newCart[productId];
            } else {
                newCart[productId] = quantity;
            }
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            return newCart;
        });
        if (isLoggedIn && currentUser?.id) {
            try {
                await axios.put(
                    `${url}/api/cart/${currentUser.id}`,
                    { productId, quantity } 
                );
                toast.success("Quantité du produit mise à jour !");
            } catch (error) {
                console.error("Erreur mise à jour quantité:", error);
                toast.error("Erreur lors de la mise à jour de la quantité.");
                setCartItems(prev => ({ ...prev, [productId]: oldQuantity })); 
                if (axios.isAxiosError(error) && error.response) {
                    if (error.response.status === 401 || error.response.status === 403) {
                        toast.info("Session expirée, veuillez vous reconnecter.");
                        router.push('/login');
                    }
                }
            }
        }
    }, [url, isLoggedIn, currentUser?.id, router, cartItems]);

    const getCartCount = useCallback(() => {
        return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
    }, [cartItems]);

    const getCartAmount = useCallback(() => {
        return Object.entries(cartItems).reduce((sum, [productId, quantity]) => {
            const product = products.find(p => String(p.id) === String(productId));
            if (product) {
                const price = product.offerPrice || product.price;
                return sum + (Number(price) * quantity);
            }
            return sum;
        }, 0);
    }, [cartItems, products]);

    const fetchUserOrders = useCallback(async () => {
        // Ajout d'un log pour voir l'état de currentUser au moment de l'appel
        console.log("fetchUserOrders called. isLoggedIn:", isLoggedIn, "currentUser:", currentUser);

        if (!isLoggedIn || !currentUser?.id) {
            setUserOrders([]); 
            setLoadingOrders(false);
            return;
        }
        setLoadingOrders(true);
        try {
            const response = await axios.get(`${url}/api/orders/${currentUser.id}`); 
            
            if (response.status === 200 && Array.isArray(response.data)) { 
                setUserOrders(response.data);
            } else {
                console.warn("La réponse de l'API /api/orders/[userId] n'est pas un tableau:", response.data);
                toast.error("Format de données de commandes inattendu.");
                setUserOrders([]);
            }
        } catch (error) {
            console.error("Erreur chargement commandes:", error);
            toast.error("Impossible de charger vos commandes. Vérifiez votre connexion.");
            setUserOrders([]);
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.info("Votre session a expiré. Veuillez vous reconnecter.");
                    if (isLoggedIn) router.push('/login');
                } else if (error.response.status === 404) {
                     toast.error("Endpoint des commandes non trouvé. Veuillez vérifier la route API.");
                }
            }
        } finally {
            setLoadingOrders(false);
        }
    }, [url, isLoggedIn, currentUser?.id, router]); // Dépendance sur currentUser?.id

    const fetchUserAddresses = useCallback(async () => {
        if (!isLoggedIn || !currentUser?.id) {
            setUserAddresses([]); 
            setLoadingAddresses(false);
            return;
        }
        setLoadingAddresses(true);
        try {
            const response = await axios.get(`${url}/api/addresses/${currentUser.id}`); 
            if (response.status === 200 && Array.isArray(response.data)) { 
                setUserAddresses(response.data);
            } else {
                console.warn("La réponse de l'API /api/addresses/[userId] n'est pas un tableau:", response.data);
                toast.error("Format de données d'adresses inattendu.");
                setUserAddresses([]);
            }
        } catch (error) {
            console.error("Erreur chargement adresses:", error);
            toast.error("Impossible de charger vos adresses. Vérifiez votre connexion.");
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.info("Votre session a expiré. Veuillez vous reconnecter.");
                    if (isLoggedIn) router.push('/login');
                } else if (error.response.status === 404) {
                    toast.error("Endpoint des adresses non trouvé. Veuillez vérifier la route API.");
                }
            }
        } finally {
            setLoadingAddresses(false);
        }
    }, [url, isLoggedIn, currentUser?.id, router]);

    const createOrder = useCallback(async (orderData) => {
        if (!isLoggedIn || !currentUser?.id) {
            toast.error("Veuillez vous connecter pour passer une commande.");
            router.push('/login');
            return { success: false, message: "Non authentifié" };
        }

        try {
            const response = await axios.get(`${url}/api/order/prepare-payment`); 

            if (response.status === 200 && response.data.success) {
                return { success: true, orderId: response.data.transactionId }; 
            } else {
                toast.error(response.data.message || "Échec de la commande.");
                return { success: false, message: response.data.message || "Échec de la commande." };
            }
        } catch (error) {
            console.error("Erreur lors de la création de la commande:", error);
            let errorMessage = "Une erreur est survenue lors de la commande.";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || `Erreur serveur: ${error.response.status}`;
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.info("Votre session a expiré. Veuillez vous reconnecter.");
                    router.push('/login');
                } else if (error.response.status === 404) {
                    errorMessage = "Endpoint de création de commande non trouvé. Vérifiez l'API ou les données.";
                } else if (error.response.status === 405) {
                    errorMessage = "Méthode non autorisée pour la création de commande. Vérifiez l'API.";
                }
            } else if (error.request) {
                errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
            } else {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            return { success: false, message: errorMessage };
        }
    }, [url, isLoggedIn, currentUser?.id, router]);


    useEffect(() => {
        if (status === 'loading') {
            setIsLoggedIn(false);
            setCurrentUser(null);
            setLoadingCart(true); 
            setLoadingOrders(true); 
            setLoadingAddresses(true); 
        } else if (status === 'authenticated' && session?.user) {
            if (!session.user.id) {
                console.error("Session user ID is missing!");
                setIsLoggedIn(false);
                setCurrentUser(null);
                return;
            }
            setCurrentUser({
                id: session.user.id, 
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                token: session.user.token, 
                role: session.user.role 
            });
            setIsLoggedIn(true);
        } else { 
            setCurrentUser(null);
            setIsLoggedIn(false);
            setCartItems({}); 
            setUserOrders([]); 
            setUserAddresses([]); 
            setLoadingCart(false);
            setLoadingOrders(false);
            setLoadingAddresses(false);
        }
    }, [session, status]);

    // Déclencher le chargement des données spécifiques à l'utilisateur UNIQUEMENT quand currentUser est prêt et connecté
    useEffect(() => {
        if (status === 'authenticated' && isLoggedIn && currentUser?.id) {
            console.log("AppContext: User authenticated, fetching user specific data.", currentUser.id);
            loadCartData();
            fetchUserOrders();
            fetchUserAddresses();
        } else if (status === 'unauthenticated') {
            console.log("AppContext: User unauthenticated, clearing user specific data.");
            // Ces actions sont déjà dans le bloc else du premier useEffect, mais on peut les répéter ici pour clarté
            setCartItems({}); 
            setUserOrders([]); 
            setUserAddresses([]); 
            setLoadingCart(false);
            setLoadingOrders(false);
            setLoadingAddresses(false);
        }
    }, [status, isLoggedIn, currentUser?.id, loadCartData, fetchUserOrders, fetchUserAddresses]); 

    useEffect(() => {
        fetchProducts(); 
    }, [fetchProducts]);


    useEffect(() => {
        let filtered = [...products];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.description && p.description.toLowerCase().includes(term)) ||
                (p.category && p.category.toLowerCase().includes(term))
            );
        }
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(p =>
                p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory]);


    const contextValue = {
        products,
        loadingProducts,
        errorProducts,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        filteredProducts,
        fetchProducts,

        cartItems, 
        addToCart,
        removeFromCart,
        deleteFromCart,
        updateCartQuantity,
        getCartCount,
        getCartAmount,
        loadingCart,
        loadCartData,

        currentUser,
        setCurrentUser,
        isLoggedIn, 

        userOrders,
        loadingOrders,
        fetchUserOrders,
        createOrder, 

        userAddresses,
        loadingAddresses,
        fetchUserAddresses,

        currency,
        setCurrency,
        formatPriceInFCFA,
        deliveryFee,
        setDeliveryFee,
        url,
        router
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
