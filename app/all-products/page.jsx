// app/all-products/page.jsx
'use client'; // Ce composant est un Client Component

import React from 'react';
import { useAppContext } from '@/context/AppContext'; // Assurez-vous que ce chemin est correct
import ProductCard from '@/components/ProductCard'; // Assurez-vous d'avoir un VRAI composant ProductCard ici
import { useRouter } from 'next/navigation'; // Importez useRouter
import Footer from '@/components/Footer'; // Importez le composant Footer

export default function AllProductsPage() {
    // Récupérez les valeurs nécessaires de votre contexte unifié
    const {
        filteredProducts,
        loadingProducts,
        errorProducts,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        addToCart, // addToCart est toujours nécessaire si le ProductCard a un bouton "Ajouter au panier"
        formatPriceInFCFA, // Fonction de formatage des prix en FCFA
    } = useAppContext();

    const router = useRouter(); // Initialisez le hook useRouter

    if (loadingProducts) {
        return (
            <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-gray-700">
                <p>Chargement des produits...</p>
            </div>
        );
    }

    if (errorProducts) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen text-red-600 font-semibold text-lg text-center p-4">
                <p>Erreur lors du chargement des produits: {errorProducts}</p>
                <p className="mt-4">Veuillez rafraîchir la page ou vérifier votre connexion.</p>
            </div>
        );
    }

    return (
        // Utilisation de flex-col et min-h-screen pour que le footer reste toujours en bas
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container mx-auto p-4 md:p-8 max-w-7xl"> {/* main prend l'espace disponible, poussant le footer en bas */}
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 text-center drop-shadow-sm">
                    Découvrez tous nos Produits
                </h1>

                {/* Section de recherche et de filtre */}
                <div className="mb-12 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 p-4 bg-white rounded-lg shadow-md">
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-2/5 text-gray-800 placeholder-gray-500 transition duration-300 ease-in-out"
                        aria-label="Rechercher des produits"
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-1/4 bg-white text-gray-800 appearance-none pr-8 transition duration-300 ease-in-out"
                        aria-label="Filtrer par catégorie"
                    >
                        <option value="All">Toutes les catégories</option>
                        {/* Les catégories que vous avez spécifiées */}
                        <option value="Ordinateurs">Ordinateurs</option>
                        <option value="Ecouteurs">Ecouteurs</option>
                        <option value="Televisions">Télévisions</option>
                        <option value="Accessoires">Accessoires</option>
                        <option value="Telephones">Téléphones</option>
                        {/* Assurez-vous que ces valeurs correspondent exactement à celles dans votre DB */}
                    </select>
                </div>

                {filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-600 text-lg py-10">
                        Aucun produit ne correspond à votre recherche ou à vos filtres.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id || product._id} // Assurez-vous que product.id est l'ID unique de la DB
                                product={product}
                                addToCart={addToCart}
                                formatPrice={formatPriceInFCFA} // C'est ici que la fonction de formatage est passée
                                router={router} // PASSEZ LE HOOK 'router' AU COMPOSANT ProductCard
                            />
                        ))}
                    </div>
                )}
            </main>
            {/* Intégrez votre composant Footer commun ici */}
            <Footer />
        </div>
    );
}
