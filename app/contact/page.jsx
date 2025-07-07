'use client';

import React from 'react';
import { Mail, Phone, MapPin, Lightbulb, ShieldCheck, LifeBuoy, TrendingUp } from 'lucide-react';

// Placeholder for Footer component since it's imported from an external path
// In a real Next.js app, this would be your actual Footer component.
const Footer = () => (
    <footer className="bg-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8 text-center rounded-t-3xl">
        <div className="max-w-6xl mx-auto">
            <p>&copy; {new Date().getFullYear()} Plawimadd Group. Tous droits réservés.</p>
            
        </div>
    </footer>
);

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-100">
            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-3xl p-8 lg:p-12">
                    {/* Titre principal */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                            Nous sommes à l'écoute de vos préoccupations
                        </h1>
                        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
                            Notre équipe est à votre disposition pour vous accompagner et répondre à toutes vos demandes. Que ce soit pour des informations sur nos produits, une assistance technique ou un suivi de commande, nous sommes là pour vous.
                        </p>
                        <div className="bg-blue-100 text-blue-800 p-4 rounded-lg shadow-lg text-xl font-semibold flex items-center justify-center gap-2 animate-pulse">
                            <MapPin className="h-6 w-6" />
                            <span>
                                Situé en face du <span className="font-bold text-blue-700">Complexe Scolaire Privé Sainte Bakhita de Calavi</span> !
                            </span>
                        </div>
                    </div>

                    {/* Section des 4 options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {/* Conseil */}
                        <div className="group relative flex flex-col items-center text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 hover:scale-105 duration-300">
                            <Lightbulb className="h-16 w-16 text-blue-600 mb-4 group-hover:text-blue-800" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conseil</h3>
                            <p className="text-gray-600 mb-4">
                                Notre équipe vous accompagne à chaque étape de votre projet.
                            </p>
                        </div>

                        {/* Garantie */}
                        <div className="group relative flex flex-col items-center text-center p-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 hover:scale-105 duration-300">
                            <ShieldCheck className="h-16 w-16 text-green-600 mb-4 group-hover:text-green-800" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Garantie</h3>
                            <p className="text-gray-600 mb-4">
                                Nous proposons une garantie sur tous nos produits.
                            </p>
                            <p className="font-semibold text-gray-700 mt-auto">06 Mois</p>
                        </div>

                        {/* SAV */}
                        <div className="group relative flex flex-col items-center text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 hover:scale-105 duration-300">
                            <LifeBuoy className="h-16 w-16 text-purple-600 mb-4 group-hover:text-purple-800" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">SAV</h3>
                            <p className="text-gray-600 mb-4">
                                Nous assurons un service après-vente réactif.
                            </p>
                        </div>

                        {/* Flexibilité */}
                        <div className="group relative flex flex-col items-center text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 hover:scale-105 duration-300">
                            <TrendingUp className="h-16 w-16 text-yellow-600 mb-4 group-hover:text-yellow-800" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Flexibilité</h3>
                            <p className="text-gray-600 mb-4">
                                Nous adaptons nos offres à tous les budgets.
                            </p>
                            <p className="font-semibold text-gray-700 mt-auto">De meilleurs prix</p>
                        </div>
                    </div>

                    {/* Section Contact */}
                    <div className="mt-16">
                        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Nos Coordonnées</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-lg shadow">
                                <Mail className="h-8 w-8 text-purple-600" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Email</h3>
                                    <a href="mailto:plawimaddgroup1beninbranch@gmail.com" className="text-purple-600 hover:underline font-semibold mt-auto">plawimaddgroup1beninbranch@gmail.com</a>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-lg shadow">
                                <Phone className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Téléphone</h3>
                                    <a href="tel:+22960701774" className="text-blue-600 hover:underline font-semibold mt-auto">+(229) 0197747178</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section "Où nous trouver" avec Google Maps */}
                    <div className="mt-16">
                        <h2 className="text-4xl font-bold text-gray-900 text-center mb-6">Où nous trouver</h2>
                        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg shadow-lg text-center text-xl font-semibold flex items-center justify-center gap-2">
                            <MapPin className="h-6 w-6" />
                            <span>
                                En face du <span className="font-bold text-yellow-700">Complexe Scolaire Privé Sainte Bakhita de Calavi</span> !
                            </span>
                        </div>
                        <div className="rounded-lg overflow-hidden shadow-md mt-6">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.6699711648557!2d2.3369086747920482!3d6.436417293554789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1024a852f870d037%3A0xb2997b4d2c9ed96a!2sComplexe%20Scolaire%20Priv%C3%A9%20Sainte%20Bakhita!5e0!3m2!1sfr!2sbj!4v1750695511613!5m2!1sfr!2sbj"
                                width="100%"
                                height="350"
                                style={{ border: 0, borderRadius: '8px' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Localisation"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
