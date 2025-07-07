// app/seller/product-list/page.jsx
'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import { MdDeleteForever, MdEdit } from "react-icons/md";
import ConfirmationModal from "@/components/ConfirmationModal";
import Link from "next/link";

const ProductList = () => {
    const { products, loadingProducts, fetchProducts, formatPriceInFCFA } = useAppContext();

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [productIdToDelete, setProductIdToDelete] = useState(null);

    const confirmDelete = (productId) => {
        setProductIdToDelete(productId);
        setShowConfirmationModal(true);
    };

    const executeDelete = async () => {
        setShowConfirmationModal(false);
        if (!productIdToDelete) return;

        try {
            const response = await fetch(`/api/products/${productIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Erreur ${response.status}`);
                } else {
                    throw new Error(`Erreur serveur ${response.status}`);
                }
            }

            const result = await response.json();
            if (result.success) {
                toast.success("Produit supprimé avec succès !");
                fetchProducts();
            } else {
                toast.error(result.message || "Erreur de suppression.");
            }
        } catch (error) {
            console.error("Erreur suppression :", error);
            toast.error(`Erreur : ${error.message}`);
        } finally {
            setProductIdToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmationModal(false);
        setProductIdToDelete(null);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <main className="flex-1 p-4 md:p-8 lg:p-10">
                {loadingProducts ? (
                    <Loading />
                ) : (
                    <div className="w-full bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200"> {/* CHANGEMENT: Removed max-w-6xl mx-auto, added w-full */}
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-gray-800">Gérer Produits</h2>
                            <Link
                                href="/seller/add-products"
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                            >
                                + Ajouter un produit
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/5 sm:w-1/3">Produit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Catégorie</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5 sm:w-auto">Prix</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5 sm:w-auto">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.length > 0 ? (
                                        products.map((product) => {
                                            let imageUrls = [];

                                            if (Array.isArray(product.imgUrl)) {
                                                imageUrls = product.imgUrl;
                                            } else if (typeof product.imgUrl === 'string') {
                                                try {
                                                    const parsed = JSON.parse(product.imgUrl);
                                                    if (Array.isArray(parsed)) {
                                                        imageUrls = parsed;
                                                    } else {
                                                        imageUrls = [parsed];
                                                    }
                                                } catch (e) {
                                                    imageUrls = [product.imgUrl];
                                                }
                                            }

                                            const mainImage = imageUrls.length > 0 && imageUrls[0]
                                                ? imageUrls[0]
                                                : assets.upload_area;

                                            const displayPrice = product.offerPrice && product.offerPrice < product.price
                                                ? product.offerPrice
                                                : product.price;

                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden">
                                                                <Image
                                                                    src={mainImage}
                                                                    alt={product.name}
                                                                    width={64}
                                                                    height={64}
                                                                    className="h-full w-full object-contain p-1"
                                                                    onError={(e) => { e.currentTarget.src = assets.upload_area; }}
                                                                />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                                    {product.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500 sm:hidden">
                                                                    {product.category}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                                                        {product.category}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div className="flex flex-col">
                                                            {formatPriceInFCFA(displayPrice)}
                                                            {product.offerPrice && product.offerPrice < product.price && (
                                                                <span className="text-gray-400 line-through text-xs">
                                                                    {formatPriceInFCFA(product.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <Link
                                                                href={`/seller/product-list/edit/${product.id}`}
                                                                className="p-2 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                                title="Modifier le produit"
                                                            >
                                                                <MdEdit className="h-5 w-5" />
                                                            </Link>
                                                            <button
                                                                onClick={() => confirmDelete(product.id)}
                                                                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                                                title="Supprimer le produit"
                                                            >
                                                                <MdDeleteForever className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-10 text-lg text-gray-600">
                                                Aucun produit trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <Footer />

            <ConfirmationModal
                isOpen={showConfirmationModal}
                onClose={cancelDelete}
                onConfirm={executeDelete}
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
            />
        </div>
    );
};

export default ProductList;
