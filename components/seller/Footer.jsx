// components/seller/Footer.jsx
'use client';

import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full px-6 md:px-10 py-6 bg-zinc-100 border-t border-gray-200 shadow-inner">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 md:gap-0 max-w-7xl mx-auto">
        {/* Logo Plawimadd */}
        <div className="flex justify-center md:justify-start w-full md:w-auto">
          <Image
            src={assets.logo}
            alt="Logo Plawimadd Group"
            width={120}
            height={40}
            priority
          />
        </div>

        {/* Texte du copyright */}
        <p className="w-full md:w-auto text-center md:text-right text-gray-600 text-sm font-medium">
          © {new Date().getFullYear()} Plawimadd Group. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
