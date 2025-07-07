'use client';
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Ordinateurs",
  "Ecouteurs",
  "Télévisions",
  "Accessoires",
  "Téléphones",
];

const AddProduct = () => {
  const router = useRouter();

  const [imageFiles, setImageFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validFiles = imageFiles.filter(Boolean);
    if (validFiles.length === 0) {
      toast.error("Veuillez télécharger au moins une image de produit.");
      setLoading(false);
      return;
    }

    try {
      const uploadedImageUrls = await Promise.all(
        validFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);

          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.message || "Échec de l’upload");
          }

          const data = await uploadRes.json();
          return data.imageUrl;
        })
      );

      const productData = {
        name,
        description,
        category,
        price: parseFloat(price),
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        stock: parseInt(stock),
        imgUrl: JSON.stringify(uploadedImageUrls),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur d’enregistrement");
      }

      toast.success("Produit ajouté avec succès !");
      router.push('/seller/product-list');

    } catch (error) {
      console.error("Erreur d'ajout :", error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-10 space-y-6"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Ajouter un produit</h2>

        {/* Images */}
        <div>
          <label className="block mb-2 font-semibold text-gray-700">Images du produit</label>
          <div className="flex flex-wrap gap-4">
            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image-upload-${index}`} className="cursor-pointer">
                <input
                  type="file"
                  id={`image-upload-${index}`}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, index)}
                />
                <Image
                  src={imageFiles[index] ? URL.createObjectURL(imageFiles[index]) : assets.upload_area}
                  alt={`Image ${index + 1}`}
                  width={100}
                  height={100}
                  className="max-w-24 border border-gray-300 rounded-lg p-1 hover:ring-2 hover:ring-blue-400 transition"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Champs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Nom du produit</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Ex : Ordinateur HP"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">Prix</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="100000"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">Prix promotionnel</label>
            <input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="90000"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">Stock</label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Ex: 20"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Décrivez le produit ici..."
          ></textarea>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Ajout en cours..." : "Ajouter le produit"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
