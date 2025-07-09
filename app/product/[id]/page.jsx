'use client';

import { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { useSession } from 'next-auth/react';
import React from "react";
import { toast } from 'react-toastify';
import { Star } from 'lucide-react'; // ⭐ icône moderne

const Product = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const { addToCart, cartItems, products, formatPriceInFCFA } = useAppContext();

  const [mainImage, setMainImage] = useState(assets.default_product_image);
  const [productData, setProductData] = useState(null);
  const [loadingProductDetail, setLoadingProductDetail] = useState(true);

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        setLoadingProductDetail(false);
        return;
      }
      setLoadingProductDetail(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();

        if (res.ok && data.success && data.product) {
          const product = data.product;
          setProductData(product);

          let loadedImageUrls = [];
          if (product.imgUrl) {
            try {
              const parsed = JSON.parse(product.imgUrl);
              if (Array.isArray(parsed)) {
                loadedImageUrls = parsed;
              } else if (typeof parsed === 'string') {
                loadedImageUrls = [parsed];
              }
            } catch (e) {
              loadedImageUrls = [product.imgUrl];
            }
          }
          setMainImage(loadedImageUrls.length > 0 ? loadedImageUrls[0] : assets.default_product_image);
        } else {
          toast.error(data.message || "Produit non trouvé.");
          router.push('/');
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement du produit.");
        router.push('/');
      } finally {
        setLoadingProductDetail(false);
      }
    };

    fetchProductDetail();
  }, [id, router]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.info("Connectez-vous pour ajouter au panier.");
      router.push('/login');
      return;
    }
    if (!productData) return;

    const alreadyInCart = cartItems?.[productData.id];
    if (alreadyInCart) {
      toast.error("Produit déjà dans le panier.");
    } else {
      await addToCart(productData.id);
      toast.success("Ajouté au panier !");
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast.info("Connectez-vous pour commander.");
      router.push('/login');
      return;
    }
    if (!productData) return;

    const alreadyInCart = cartItems?.[productData.id];
    if (!alreadyInCart) {
      await addToCart(productData.id);
    }
    router.push('/cart');
  };

  const productImageUrls = (() => {
    if (!productData?.imgUrl) return [];
    try {
      const parsed = JSON.parse(productData.imgUrl);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [productData.imgUrl];
    }
  })();

  if (loadingProductDetail) {
    return (
      <div className="flex-1 min-h-screen flex justify-center items-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-gray-700">
        <p className="text-xl mb-4">Produit non trouvé.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 md:px-16 lg:px-32 pt-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* IMAGE PRINCIPALE + MINIATURES */}
          <div className="px-4 lg:px-10">
            <div className="rounded-lg overflow-hidden bg-gray-200 mb-4">
              <Image
                src={mainImage}
                alt={productData.name}
                className="w-full h-auto object-contain"
                width={1280}
                height={720}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = assets.default_product_image;
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {productImageUrls.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(image)}
                  className="cursor-pointer rounded-lg overflow-hidden bg-gray-200 border-2 border-transparent hover:border-blue-500 transition"
                >
                  <Image
                    src={image}
                    alt={`${productData.name} - Vue ${index + 1}`}
                    className="w-full h-auto object-contain"
                    width={1280}
                    height={720}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = assets.default_product_image;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* INFORMATIONS PRODUIT */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-semibold text-gray-800 mb-4">
              {productData.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={`${
                      i < Math.floor(productData.rating || 4.5)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill={i < Math.floor(productData.rating || 4.5) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                ({(productData.rating || 4.5).toFixed(1)})
              </p>
            </div>
            <p className="text-gray-600 mt-3">{productData.description}</p>
            <p className="text-3xl font-semibold mt-6">
              {formatPriceInFCFA(productData.offerPrice || productData.price)}
              {productData.offerPrice && productData.offerPrice < productData.price && (
                <span className="text-base font-normal text-gray-500 line-through ml-2">
                  {formatPriceInFCFA(productData.price)}
                </span>
              )}
            </p>
            <hr className="border-gray-300 my-6" />

            <table className="table-auto border-collapse w-full max-w-md text-gray-700">
              <tbody>
                <tr>
                  <td className="font-medium pr-4 py-2">Marque</td>
                  <td className="py-2">{productData.brand || 'Générique'}</td>
                </tr>
                <tr>
                  <td className="font-medium pr-4 py-2">Couleur</td>
                  <td className="py-2">{productData.color || 'Multicolore'}</td>
                </tr>
                <tr>
                  <td className="font-medium pr-4 py-2">Catégorie</td>
                  <td className="py-2">{productData.category}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center mt-8 gap-4">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition"
              >
                Ajouter au panier
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
              >
                Acheter maintenant
              </button>
            </div>
          </div>
        </div>

       <div className="text-center pt-16 pb-20 mt-16">
  <h2 className="text-3xl font-semibold p-10">
    Produits <span className="text-blue-600">Populaires</span>
  </h2>
  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {products
      .filter((p) => p.id !== productData?.id) // ✅ exclure le produit en cours
      .slice(0, 5)
      .map((product, index) => (
        <ProductCard key={product.id} product={product} />
      ))}
  </div>
</div>
      </div>
      <Footer />
    </>
  );
};

export default Product;
