// app/seller/product-list/edit/[id]/page.jsx
'use client';

import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import Loading from "@/components/Loading";

const CATEGORIES = [
  "Ordinateurs",
  "Ecouteurs",
  "Télévisions",
  "Accessoires",
  "Téléphones",
];

const EditProduct = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [imageFiles, setImageFiles] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      console.log("Attempting to fetch product with ID:", productId);
      if (!productId) {
        setLoading(false);
        console.error("Product ID is undefined.");
        toast.error("ID du produit manquant pour la modification.");
        router.push('/seller/product-list');
        return;
      }
      try {
        const res = await fetch(`/api/products/${productId}`);
        console.log("API Response status (GET):", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Response not OK (GET). Status:", res.status, "Body:", errorText);
          throw new Error("Produit non trouvé ou erreur de chargement.");
        }

        const data = await res.json();
        console.log("API Response data (GET):", data);

        if (data.success && data.product) {
          const product = data.product;
          setName(product.name);
          setDescription(product.description);
          setCategory(product.category);
          setPrice(product.price);
          setOfferPrice(product.offerPrice || '');
          setStock(product.stock);

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
              if (typeof product.imgUrl === 'string' && product.imgUrl.startsWith('/')) {
                loadedImageUrls = [product.imgUrl];
              } else {
                loadedImageUrls = [];
              }
              console.warn("Impossible de parser product.imgUrl comme tableau JSON, traité comme URL unique ou tableau vide:", product.imgUrl, e);
            }
          }
          setExistingImageUrls(loadedImageUrls);

        } else {
          console.error("API response indicates failure or missing product data (GET):", data);
          toast.error(data.message || "Échec du chargement du produit.");
          router.push('/seller/product-list');
        }
      } catch (error) {
        console.error("Erreur de chargement du produit dans useEffect (GET):", error);
        toast.error(`Erreur: ${error.message}`);
        router.push('/seller/product-list');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalImageUrls = [...existingImageUrls];

    try {
      const newUploadedImageUrls = await Promise.all(
        imageFiles.filter(Boolean).map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);

          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.message || "Échec de l’upload d'une nouvelle image");
          }

          const data = await uploadRes.json();
          return data.imageUrl;
        })
      );
      finalImageUrls = [...existingImageUrls, ...newUploadedImageUrls];

      if (finalImageUrls.length === 0) {
        toast.error("Veuillez télécharger au moins une image de produit.");
        setIsSubmitting(false);
        return;
      }

      const productData = {
        name,
        description,
        category,
        price: parseFloat(price),
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        stock: parseInt(stock),
        imgUrl: JSON.stringify(finalImageUrls), // imgUrl doit être une chaîne JSON d'URLs pour la DB
      };

      console.log("Sending product data for update (PUT):", productData); // LOG DE DÉBOGAGE POUR LA SOUMISSION

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      console.log("API Response status (PUT):", res.status); // LOG DE DÉBOGAGE POUR LA RÉPONSE PUT

      if (!res.ok) {
        const err = await res.json();
        console.error("API Response not OK (PUT). Error data:", err); // LOG DE DÉBOGAGE
        throw new Error(err.message || "Erreur de mise à jour");
      }

      toast.success("Produit mis à jour avec succès !");
      router.push('/seller/product-list');

    } catch (error) {
      console.error("Erreur de mise à jour dans handleSubmit (PUT):", error);
      toast.error(error.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const updatedFiles = [...imageFiles];
      updatedFiles[index] = file;
      setImageFiles(updatedFiles);
    }
  };

  const removeExistingImage = (urlToRemove) => {
    setExistingImageUrls(existingImageUrls.filter(url => url !== urlToRemove));
  };


  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex justify-center items-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-6 max-w-2xl w-full bg-white rounded shadow-md border">
        <h2 className="text-xl font-semibold text-gray-800">Modifier le produit</h2>

        <div>
          <label className="block mb-2 font-medium">Images du produit</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {existingImageUrls.map((url, index) => (
              <div key={`existing-${index}`} className="relative">
                <Image
                  src={url}
                  alt={`Image existante ${index + 1}`}
                  width={100}
                  height={100}
                  className="max-w-24 border border-blue-300 rounded-md p-1"
                  onError={(e) => { e.target.onerror = null; e.target.src = assets.upload_area; }}
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                  title="Supprimer cette image"
                >
                  X
                </button>
              </div>
            ))}
            {[...Array(Math.max(0, 4 - existingImageUrls.length))].map((_, index) => (
              <label key={`new-${index}`} htmlFor={`image-upload-${index}`} className="cursor-pointer">
                <input
                  type="file"
                  id={`image-upload-${index}`}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, index)}
                />
                <Image
                  src={imageFiles[index] ? URL.createObjectURL(imageFiles[index]) : assets.upload_area}
                  alt={`Nouvelle image ${index + 1}`}
                  width={100}
                  height={100}
                  className="max-w-24 border border-gray-300 rounded-md p-1"
                  onError={(e) => { e.target.onerror = null; e.target.src = assets.upload_area; }}
                />
              </label>
            ))}
          </div>
          {existingImageUrls.length === 0 && imageFiles.filter(Boolean).length === 0 && (
            <p className="text-red-500 text-sm">Veuillez ajouter au moins une image.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1 font-medium">Nom du produit</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ex : Ordinateur HP"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Prix</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="100000"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Prix promotionnel</label>
            <input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="90000"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Stock</label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ex: 20"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded resize-none"
            placeholder="Décrivez le produit ici..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (existingImageUrls.length === 0 && imageFiles.filter(Boolean).length === 0)}
          className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? "Mise à jour en cours..." : "Mettre à jour le produit"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
