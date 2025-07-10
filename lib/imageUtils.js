// lib/imageUtils.js
import { assets } from '@/assets/assets';

/**
 * Détermine l'URL de l'image à afficher à partir de la valeur product.imgUrl.
 * Gère les cas où imgUrl est:
 * - un tableau non vide d'URLs (ex: ['/uploads/img1.png', '/uploads/img2.png'])
 * - un tableau vide ([])
 * - null, undefined, ou une simple chaîne d'URL (cas de fallback improbable mais sécurisant)
 * @param {string | string[] | any} imgUrlValue La valeur de product.imgUrl
 * @returns {string} L'URL de l'image ou l'URL de l'image par défaut
 */
export const getImageUrl = (imgUrlValue) => {
    // Cas 1: C'est un tableau et il n'est pas vide
    if (Array.isArray(imgUrlValue) && imgUrlValue.length > 0) {
        const firstImage = imgUrlValue[0];
        // S'assurer que le premier élément est une chaîne non vide
        if (typeof firstImage === 'string' && firstImage.trim() !== '') {
            return firstImage;
        }
    }
    // Cas 2: C'est une simple chaîne non vide (pour les nouveaux uploads si le format changeait, ou si un seul est stocké)
    else if (typeof imgUrlValue === 'string' && imgUrlValue.trim() !== '') {
        return imgUrlValue;
    }

    // Cas 3: Tout autre cas (null, undefined, [], "", etc.)
    return assets.upload_area;
};