'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/assets/assets';
import { FiShoppingCart, FiStar, FiChevronRight, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const { addToCart, formatPriceInFCFA, cartItems } = useAppContext();
  const router = useRouter();
  const toastShownRef = useRef(false); // Empêche les toasts multiples rapides

  if (!product) return null;

  const displayPrice =
    product.offerPrice && product.offerPrice < product.price
      ? product.offerPrice
      : product.price;

  const imageUrl = product.imgUrl?.[0] || assets.default_product_image;
  const isInCart = Boolean(cartItems[product.id]);

  const handleAddToCart = (e) => {
    e.stopPropagation();

    if (isInCart) {
      if (!toastShownRef.current) {
        toast.info('Ce produit est déjà dans votre panier');
        toastShownRef.current = true;
        setTimeout(() => (toastShownRef.current = false), 1000);
      }
      return;
    }

    addToCart(product.id);

    if (!toastShownRef.current) {
      toast.success('Produit ajouté au panier');
      toastShownRef.current = true;
      setTimeout(() => (toastShownRef.current = false), 1000);
    }
  };

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    router.push(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col bg-zinc-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden h-full border border-zinc-200"
    >
      <div className="relative w-full aspect-square bg-zinc-50 overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name || 'Produit'}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          width={400}
          height={400}
          priority
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={handleAddToCart}
            className={`p-3 rounded-full shadow-lg transition
              ${
                isInCart
                  ? 'bg-green-100 text-green-600 cursor-default'
                  : 'bg-white hover:bg-blue-600 hover:text-white text-blue-600'
              }
              flex items-center justify-center`}
            aria-label={isInCart ? 'Déjà au panier' : 'Ajouter au panier'}
            disabled={isInCart}
            title={isInCart ? 'Déjà au panier' : 'Ajouter au panier'}
            style={{ boxShadow: '0 4px 10px rgba(0, 123, 255, 0.3)' }}
          >
            {isInCart ? <FiCheck size={20} /> : <FiShoppingCart size={20} />}
          </button>
        </div>
      </div>

      <div className="p-2 flex flex-col flex-grow">
        <h3 className="text-zinc-900 font-bold text-lg leading-tight line-clamp-2 mb-2">
          {product.name}
        </h3>

        <p className="text-zinc-500 text-xs line-clamp-3 mb-2">{product.description}</p>

        <div className="flex items-center gap-1 mb-0">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating || 4.5)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-zinc-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500 ml-1">
            {(product.rating || 4.5).toFixed(1)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-blue-900 mt-auto">
              {formatPriceInFCFA(displayPrice)}
            </p>
            {product.offerPrice && product.offerPrice < product.price && (
              <p className="text-xs text-zinc-400 line-through">
                {formatPriceInFCFA(product.price)}
              </p>
            )}
          </div>

          <div className="hidden lg:flex">
            <button
              onClick={handleViewClick}
              className="flex items-center gap-1 px-2 py-2 text-xs font-medium rounded-lg transition"
              style={{ backgroundColor: '#2563EB', color: 'white', userSelect: 'none' }}
              onMouseDown={(e) => e.preventDefault()}
              aria-label={`Voir détails de ${product.name}`}
            >
              Voir <FiChevronRight size={12} color="white" />
            </button>
          </div>

          <button
            onClick={handleViewClick}
            className="lg:hidden flex items-center text-blue-600 text-sm font-medium select-none"
            style={{ userSelect: 'none' }}
            aria-label={`Voir détails de ${product.name}`}
          >
            Voir <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
