// components/ConfirmationModal.jsx
import React from 'react';

// Composant Modal de confirmation réutilisable
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    // Si le modal n'est pas ouvert, ne rien rendre
    if (!isOpen) return null;

    return (
        // Overlay sombre pour l'arrière-plan
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {/* Conteneur du modal */}
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto p-6 relative">
                {/* Titre du modal */}
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
                
                {/* Message du modal */}
                <p className="text-gray-700 mb-6">{message}</p>
                
                {/* Boutons d'action */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose} // Appelle la fonction de fermeture passée en prop
                        className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                        Non, annuler
                    </button>
                    <button
                        onClick={onConfirm} // Appelle la fonction de confirmation passée en prop
                        className="px-5 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                    >
                        Oui, supprimer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
