// components/Navbar.jsx
'use client';

import React, { useState, useRef, useEffect } from "react";
import { assets } from "@/assets/assets";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from 'next-auth/react';

// Import React Icons
import {
    FaSearch,
    FaUser,
    FaHome,
    FaShoppingBag, // Utilisé pour Mes Commandes
    FaGift,
    FaEnvelope, // ICÔNE D'ENVELOPPE POUR LE CONTACT
    FaBars,
    FaTimes,
    FaSignInAlt,
    FaUserPlus,
    FaShoppingCart,
    FaSignOutAlt,
} from "react-icons/fa";
import { MdOutlineDashboard } from "react-icons/md";

// IMPORTANT : Assurez-vous d'avoir ces animations CSS définies dans votre fichier CSS global
// (par exemple, dans `app/globals.css` ou `styles/globals.css`)
// Exemple:
// @keyframes bounce-once {
//   0%, 100% { transform: translateY(0); }
//   20% { transform: translateY(-8px); }
//   40% { transform: translateY(0); }
//   60% { transform: translateY(-4px); }
//   80% { transform: translateY(0); }
// }
// .animate-bounce-once { animation: bounce-once 0.5s ease-in-out; }

// @keyframes fade-in-down {
//   from { opacity: 0; transform: translateY(-10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }


const Navbar = () => {
    // Récupérer les états et fonctions nécessaires du contexte, incluant searchTerm et setSearchTerm
    const { searchTerm, setSearchTerm, getCartCount } = useAppContext();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession(); // status can be 'loading', 'authenticated', 'unauthenticated'

    const isLoggedIn = status === 'authenticated';
    // Déterminez si l'utilisateur connecté est un Admin
    const isAdmin = isLoggedIn && session?.user?.role === 'ADMIN';
    // Déterminez si l'utilisateur est un Vendeur (non-Admin)
    const isSeller = isLoggedIn && session?.user?.role === 'SELLER';


    // Fallback pour userFullName et userInitial. Priorisez name, puis firstName, puis préfixe de l'email.
    const userFullName = session?.user?.name || session?.user?.firstName || (session?.user?.email ? session.user.email.split('@')[0] : '');
    const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : '';

    const getAvatarColorClass = (initial) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500',
            'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
        ];
        if (!initial) return 'bg-gray-400';
        const index = initial.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopSearchInputVisible, setIsDesktopSearchInputVisible] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

    const accountButtonRef = useRef(null);
    const dropdownRef = useRef(null);
    const cartIconRef = useRef(null);
    const desktopSearchInputRef = useRef(null); // Ref pour l'input de recherche desktop

    const [animateCart, setAnimateCart] = useState(false);
    const prevCartItemCount = useRef(0);

    // Utilisation de useEffect pour l'animation du panier
    useEffect(() => {
        const currentCartCount = getCartCount();
        if (currentCartCount > 0 && currentCartCount !== prevCartItemCount.current) {
            setAnimateCart(true);
            const timer = setTimeout(() => {
                setAnimateCart(false);
            }, 500);
            return () => clearTimeout(timer);
        }
        prevCartItemCount.current = currentCartCount;
    }, [getCartCount]); // Dépend de getCartCount pour s'assurer de la réactivité si elle change

    // Gestion du clic en dehors du menu déroulant du compte
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                accountButtonRef.current &&
                !accountButtonRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsAccountDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [accountButtonRef, dropdownRef]);

    // Gérer la visibilité du champ de recherche desktop et la liaison au contexte
    useEffect(() => {
        // Si on est sur la page des produits et qu'il y a un terme de recherche, on affiche l'input
        if (pathname === '/all-products' && searchTerm) {
            setIsDesktopSearchInputVisible(true);
        }
        // Si l'input desktop est visible, focus dessus
        if (isDesktopSearchInputVisible && desktopSearchInputRef.current) {
            desktopSearchInputRef.current.focus();
        }
    }, [pathname, searchTerm, isDesktopSearchInputVisible]);

    // Gère le changement dans le champ de recherche desktop et mobile
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value); // Met à jour le terme de recherche dans le contexte
        // Si l'utilisateur n'est pas déjà sur la page des produits, redirigez-le
        if (pathname !== '/all-products') {
            router.push('/all-products');
        }
    };

    // Gère le toggle de visibilité de la recherche desktop
    const toggleDesktopSearchVisibility = () => {
        // Si l'input est sur le point de devenir invisible, vide le terme de recherche
        if (isDesktopSearchInputVisible) {
            setSearchTerm('');
        }
        setIsDesktopSearchInputVisible(prev => !prev);
    };

    const getLinkClassName = (href) => {
        const baseClasses = "hover:text-gray-900 transition";
        const activeClasses = "text-blue-600 font-semibold";
        // Vérifie si le chemin actuel commence par le href donné pour l'activation
        // Gère le cas spécial de la racine "/"
        if (href === "/" && pathname === "/") {
            return `${baseClasses} ${activeClasses}`;
        }
        if (href !== "/" && pathname.startsWith(href)) {
            return `${baseClasses} ${activeClasses}`;
        }
        return baseClasses;
    };

    const getMobileMenuItemClassName = (href) => {
        const baseClasses =
            "flex items-center gap-3 text-lg w-full py-2 px-3 rounded-md transition duration-200 ease-in-out";
        const activeClasses = "bg-indigo-100 text-indigo-700 font-semibold";
        const hoverClasses = "hover:bg-zinc-200 hover:text-zinc-950";
        // Vérifie si le chemin actuel commence par le href donné pour l'activation
        // Gère le cas spécial de la racine "/"
        if (href === "/" && pathname === "/") {
            return `${baseClasses} ${activeClasses}`;
        }
        if (href !== "/" && pathname.startsWith(href)) {
            return `${baseClasses} ${activeClasses}`;
        }
        return `${baseClasses} ${hoverClasses}`;
    };

    const handleLogoutConfirmation = () => {
        setIsAccountDropdownOpen(false); // Ferme le dropdown immédiatement
        setIsMobileMenuOpen(false); // Ferme le menu mobile immédiatement
        setShowLogoutOverlay(true);
    };

    const confirmLogout = async () => {
        setShowLogoutOverlay(false);
        await signOut({ callbackUrl: '/' });
    };

    const cancelLogout = () => {
        setShowLogoutOverlay(false);
    };

    return (
        <>
            {/* Logout Confirmation Overlay */}
            {showLogoutOverlay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">Confirmation de déconnexion</h3>
                        <p className="mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelLogout}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b bg-zinc-100 text-zinc-950 relative z-30">
                {/* Logo (Left side) */}
                <Link href="/">
                    <Image
                        src={assets.logo}
                        alt="Logo"
                        className="w-[120px] md:w-[150px] lg:w-[180px] hover:scale-105 transition-transform"
                        priority={true}
                    />
                </Link>

                {/* Desktop Navigation Links (Middle) */}
                <div className="hidden md:flex items-center gap-4 lg:gap-8 text-zinc-950">
                    <div className="p-2 hover:bg-zinc-200 rounded-3xl hover:scale-105 transition-transform hover:font-semibold">
                        <Link href="/" className={getLinkClassName("/")}>
                            Accueil
                        </Link>
                    </div>
                    <div className="p-2 hover:bg-zinc-200 rounded-3xl hover:scale-105 transition-transform hover:font-semibold">
                        <Link
                            href="/all-products"
                            className={getLinkClassName("/all-products")}
                        >
                            Boutique
                        </Link>
                    </div>
                    <div className="p-2 hover:bg-zinc-200 rounded-3xl hover:scale-105 transition-transform hover:font-semibold">
                        <Link href="/offer" className={getLinkClassName("/offer")}>
                            Offres
                        </Link>
                    </div>
                    {/* NOUVEAU LIEN : Contact pour Desktop */}
                    <div className="p-2 hover:bg-zinc-200 rounded-3xl hover:scale-105 transition-transform hover:font-semibold">
                        <Link href="/contact" className={getLinkClassName("/contact")}>
                            Contact
                        </Link>
                    </div>

                    {/* Conditional rendering for Admin/Seller Dashboard links on Desktop */}
                    {status !== 'loading' && (
                        <>
                            {isAdmin && (
                                <button
                                    onClick={() => router.push("/seller")}
                                    className="text-xs border px-4 py-1.5 rounded-full hover:text-semibold hover:scale-105 transition-transform border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-zinc-50"
                                >
                                    Tableau de bord (Admin)
                                </button>
                            )}
                            {!isAdmin && isSeller && (
                                <button
                                    onClick={() => router.push("/seller")}
                                    className="text-xs border px-4 py-1.5 rounded-full hover:text-semibold hover:scale-105 transition-transform border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-zinc-50"
                                >
                                    Tableau de bord (Vendeur)
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Desktop Icons (Right side) */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Shopping Cart Icon (visible only if logged in and status is not loading) */}
                    {status !== 'loading' && (
                        <Link href="/cart" className={`relative cursor-pointer group ${!isLoggedIn ? 'hidden' : ''}`} ref={cartIconRef}>
                            <FaShoppingCart className="w-6 h-6 text-gray-700 hover:scale-105 hover:text-blue-700 transition-transform" />
                            {getCartCount() > 0 && (
                                <span className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${animateCart ? 'animate-bounce-once' : ''}`}>
                                    {getCartCount()}
                                </span>
                            )}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                                Mon Panier
                            </span>
                        </Link>
                    )}

                    {/* Desktop Search Input */}
                    <div className="relative">
                        <FaSearch
                            className="w-5 h-5 cursor-pointer text-gray-700 hover:scale-105 hover:text-blue-700 transition-transform"
                            onClick={toggleDesktopSearchVisibility} // Utilise la nouvelle fonction de toggle
                        />
                        {isDesktopSearchInputVisible && (
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm} // Connecté au searchTerm du contexte
                                onChange={handleSearchChange} // Connecté au gestionnaire de recherche
                                ref={desktopSearchInputRef} // Permet le focus automatique
                                className="absolute right-0 top-full mt-2 p-2 border border-gray-300 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 z-10 bg-white text-zinc-950"
                                onBlur={() => {
                                    // Masque l'input si le focus est perdu ET qu'il n'y a pas de searchTerm
                                    if (!searchTerm) {
                                        setIsDesktopSearchInputVisible(false);
                                    }
                                }}
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Account Button/Dropdown */}
                    <div className="relative" ref={accountButtonRef}>
                        {/* Rendre le bouton de compte seulement si le statut de la session n'est pas "loading" */}
                        {status !== 'loading' ? (
                            <button
                                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                                className={`flex items-center justify-center p-2 rounded-full transition-transform focus:outline-none relative group
                                    ${isLoggedIn ? `${getAvatarColorClass(userInitial)} text-white w-9 h-9 text-lg font-bold hover:scale-110` : 'text-zinc-950 hover:bg-zinc-200 w-auto'}`}
                                title={isLoggedIn && userFullName ? userFullName : "Mon Compte"}
                            >
                                {isLoggedIn ? (
                                    userInitial || <FaUser className="w-5 h-5" />
                                ) : (
                                    <>
                                        <FaUser className="w-5 h-5 mr-2" />
                                        <span>Compte</span>
                                    </>
                                )}
                                {isLoggedIn && userFullName && (
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                                        {userFullName}
                                    </span>
                                )}
                            </button>
                        ) : (
                            // Optionnel: Afficher un loader ou un placeholder pendant le chargement de la session
                            <div className="w-9 h-9 bg-gray-300 rounded-full animate-pulse"></div>
                        )}

                        {isAccountDropdownOpen && (
                            <div
                                ref={dropdownRef}
                                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20"
                            >
                                {status !== 'loading' ? ( // S'assurer que le contenu du dropdown est basé sur l'état final de la session
                                    !isLoggedIn ? (
                                        <>
                                            <Link href="/register"
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <FaUserPlus className="w-4 h-4" />
                                                S'inscrire
                                            </Link>
                                            <Link href="/login"
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <FaSignInAlt className="w-4 h-4" />
                                                Se connecter
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <div className="px-4 py-2 border-b border-gray-200 text-sm">
                                                <p className="font-semibold text-gray-800">{userFullName}</p>
                                                <p className="text-gray-500 truncate">{session?.user?.email}</p>
                                            </div>
                                            {/* 'Mon Profil' est supprimé ici */}
                                            <Link href="/cart"
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <FaShoppingCart className="w-4 h-4" />
                                                Mon Panier
                                            </Link>
                                            <Link href="/my-orders" // Assurez-vous que le chemin est '/my-orders' ou '/orders' selon votre choix
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <FaShoppingBag className="w-4 h-4" /> {/* Utilisez une icône appropriée */}
                                                Mes Commandes
                                            </Link>
                                            {/* Admin/Seller Dashboard links in dropdown */}
                                            {isAdmin && (
                                                <Link href="/seller"
                                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                >
                                                    <MdOutlineDashboard className="w-4 h-4" />
                                                    Tableau de bord (Admin)
                                                </Link>
                                            )}
                                            {!isAdmin && isSeller && (
                                                <Link href="/seller"
                                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                    onClick={() => setIsAccountDropdownOpen(false)}
                                                >
                                                    <MdOutlineDashboard className="w-4 h-4" />
                                                    Tableau de bord (Vendeur)
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogoutConfirmation}
                                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                                            >
                                                <FaSignOutAlt className="w-4 h-4" />
                                                Déconnexion
                                            </button>
                                        </>
                                    )
                                ) : (
                                    <div className="px-4 py-2 text-gray-500">Chargement...</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Hamburger Icon */}
                <div className="md:hidden flex items-center gap-3">
                    {/* Mobile Shopping Cart Icon (visible only if logged in and status is not loading) */}
                    {status !== 'loading' && (
                        <Link href="/cart" className={`relative cursor-pointer group ${!isLoggedIn ? 'hidden' : ''}`}>
                            <FaShoppingCart className="w-7 h-7 text-gray-700 hover:scale-105 hover:text-blue-700 transition-transform" />
                            {getCartCount() > 0 && (
                                <span className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${animateCart ? 'animate-bounce-once' : ''}`}>
                                    {getCartCount()}
                                </span>
                            )}
                        </Link>
                    )}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {isMobileMenuOpen ? (
                            <FaTimes className="w-7 h-7 text-zinc-950" />
                        ) : (
                            <FaBars className="w-7 h-7 text-zinc-950" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-zinc-100 border-b shadow-lg z-20 flex flex-col items-start px-6 py-4 space-y-2 animate-fade-in-down">
                        {/* Mobile Search Input */}
                        <div className="w-full mb-4">
                            <div className="relative">
                                <FaSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm} // Connecté au searchTerm du contexte
                                    onChange={handleSearchChange} // Connecté au gestionnaire de recherche
                                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-950"
                                />
                            </div>
                        </div>

                        {status !== 'loading' && (
                            <>
                                {isLoggedIn && (
                                    <div className="w-full px-3 py-2 border-b border-gray-200 text-sm mb-2">
                                        <p className="font-semibold text-gray-800">{userFullName}</p>
                                        <p className="text-gray-500 truncate">{session?.user?.email}</p>
                                    </div>
                                )}

                                {/* Mobile Navigation Links with Icons */}
                                <Link
                                    href="/"
                                    className={getMobileMenuItemClassName("/")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FaHome className="w-5 h-5" />
                                    Accueil
                                </Link>
                                <Link
                                    href="/all-products"
                                    className={getMobileMenuItemClassName("/all-products")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FaShoppingBag className="w-5 h-5" />
                                    Boutique
                                </Link>
                                <Link
                                    href="/offer"
                                    className={getMobileMenuItemClassName("/offer")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FaGift className="w-5 h-5" />
                                    Offres
                                </Link>
                                {/* NOUVEAU LIEN : Contact pour Mobile */}
                                <Link
                                    href="/contact"
                                    className={getMobileMenuItemClassName("/contact")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FaEnvelope className="w-5 h-5" /> {/* Utilisez FaEnvelope */}
                                    Contact
                                </Link>

                                {!isLoggedIn ? (
                                    <>
                                        <Link
                                            href="/register"
                                            className={getMobileMenuItemClassName("/register")}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaUserPlus className="w-5 h-5" />
                                            S'inscrire
                                        </Link>
                                        <Link
                                            href="/login"
                                            className={getMobileMenuItemClassName("/login")}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaSignInAlt className="w-5 h-5" />
                                            Se connecter
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {/* 'Mon Profil' est supprimé ici */}
                                        <Link
                                            href="/cart"
                                            className={getMobileMenuItemClassName("/cart")}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaShoppingCart className="w-5 h-5" />
                                            Mon Panier
                                        </Link>
                                        <Link
                                            href="/my-orders" // Assurez-vous que le chemin est '/my-orders' ou '/orders'
                                            className={getMobileMenuItemClassName("/my-orders")}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FaShoppingBag className="w-5 h-5" /> {/* Icône pour Mes Commandes */}
                                            Mes Commandes
                                        </Link>
                                        {/* Admin Dashboard link in mobile menu */}
                                        {isAdmin && (
                                            <Link href="/seller"
                                                className={getMobileMenuItemClassName("/seller")}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <MdOutlineDashboard className="w-5 h-5" />
                                                Tableau de bord (Admin)
                                            </Link>
                                        )}
                                        {/* Seller Dashboard link in mobile menu (if distinct from Admin) */}
                                        {!isAdmin && isSeller && (
                                            <Link href="/seller"
                                                className={getMobileMenuItemClassName("/seller")}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <MdOutlineDashboard className="w-5 h-5" />
                                                Tableau de bord (Vendeur)
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogoutConfirmation}
                                            className="flex items-center gap-3 text-lg w-full py-2 px-3 rounded-md transition duration-200 ease-in-out text-red-600 hover:bg-red-50"
                                        >
                                            <FaSignOutAlt className="w-5 h-5" />
                                            Déconnexion
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
