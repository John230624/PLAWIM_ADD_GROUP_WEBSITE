// components/Footer.jsx
'use client';

import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import {
  FaHome,
  FaTags,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaMapMarkerAlt,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";
import { AiFillFileText } from "react-icons/ai";
import { SiTiktok } from "react-icons/si";

const Footer = () => {
  // Catégories de produits fixes - "Accessoires" placé entre "Télévisions" et "Ordinateurs"
  const fixedCategories = ["Écouteurs" , "Télévisions" , "Téléphones" , "Accessoires" , "Ordinateurs"];

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-300 rounded-t-xl shadow-lg">
      <div className="container mx-auto px-6 py-12 lg:py-16">
        {/* Grille principale - Réduction du gap à gap-6 pour rapprocher les colonnes */}
        {/* Adjusted lg:gap-8 to provide more space for the contact section on large screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Section Logo et Description */}
          <div className="flex flex-col items-start space-y-4 lg:pr-4">
            <Image
              className="w-32 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105"
              src={assets.logo}
              alt="Company Logo"
              width={128}
              height={128}
            />
            <p className="text-sm leading-relaxed">
              Plawimadd Group vous inspire et simplifie votre quotidien, avec des produits fiables et accessibles pour répondre à tous vos besoins.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://www.facebook.com/share/g/16fq7NamkG/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <FaFacebook className="text-2xl" />
              </a>
              <a
                href="https://www.tiktok.com/@plawimadd/video/7479513419507404037?is_from_webapp=1&sender_device=pc&web_id=7517981210821838392"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <SiTiktok className="text-2xl" />
              </a>
              <a
                href="https://www.instagram.com/plawimadd?igsh=MXR4NHJvcW9zdXY3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <FaInstagram className="text-2xl" />
              </a>
            </div>
          </div>

          {/* Section Navigation */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Navigation</h2>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="flex items-center text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <FaHome className="mr-3 text-blue-400" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/offers"
                  className="flex items-center text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <FaTags className="mr-3 text-blue-400" />
                  Offres
                </Link>
              </li>
              <li>
                <Link
                  href="/all-products"
                  className="flex items-center text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <FaHome className="mr-3 text-blue-400" />
                  Boutique
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <FaPhone className="mr-3 text-blue-400" />
                  Contactez-nous
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="flex items-center text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <AiFillFileText className="mr-3 text-blue-400" />
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Section Catégories de produits - Maintenant avec une liste fixe et lien vers /all-products */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Catégories</h2>
            <ul className="space-y-3">
              {fixedCategories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/all-products?category=${encodeURIComponent(category)}`}
                    className="flex items-center text-gray-400 hover:text-blue-400 transition-colors capitalize"
                  >
                    <FaTags className="mr-3 text-blue-400" /> {/* Utilisation de FaTags pour les catégories */}
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section Contact */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Nous contacter</h2>
            <address className="not-italic space-y-4 text-gray-400">
              <div className="flex items-start">
                <FaMapMarkerAlt className="mt-1 mr-3 text-blue-400 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                <span>Abomey Calavi en face du Collège Bakhita, Bénin</span>
              </div>
              <div className="flex flex-col space-y-1"> {/* Adjusted space-y for phone numbers */}
                <div className="flex items-center">
                  <FaPhone className="mr-3 text-blue-400 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                  <a href="tel:+2290197747178" className="hover:text-blue-400 transition-colors">
                    +(229) 0197747178
                  </a>
                </div>
                <div className="flex items-center">
                  <FaPhone className="mr-3 text-blue-400 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                  <a href="tel:+2290197918000" className="hover:text-blue-400 transition-colors">
                    +(229) 0197918000
                  </a>
                </div>
                <div className="flex items-center">
                  <FaPhone className="mr-3 text-blue-400 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                  <a href="tel:+2290148232681" className="hover:text-blue-400 transition-colors">
                    +(229) 0148232681
                  </a>
                </div>
              </div>
              <div className="flex items-center"> {/* Changed from space-x to flex items-center with mr-3 on icon */}
                <FaEnvelope className="mr-3 text-blue-400 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                <a
                  href="mailto:plawimaddgroup1beninbranch@gmail.com"
                  className="hover:text-blue-400 transition-colors"
                >
                  plawimaddgroup1beninbranch@gmail.com
                </a>
              </div>
              <div className="flex items-center">
                <FaClock className="mr-3 text-blue-400 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                <span>Lundi-Samedi: 09h-21h</span>
              </div>
            </address>
          </div>
        </div>
      </div>

      {/* Section Copyright */}
      <div className="bg-gray-900/80 py-4 pt-0 rounded-b-lg text-center">
        <p className="text-gray-500 text-sm">
          Développé par Tiburce & Jean. &copy; {new Date().getFullYear()} Plawimadd Group. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
