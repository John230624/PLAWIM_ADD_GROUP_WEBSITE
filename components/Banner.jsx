"use client";
import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { motion } from "framer-motion";

const Banner = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between md:pl-20 py-14 md:py-0 bg-zinc-100 my-16 rounded-xl overflow-hidden relative">
      {/* Animation pour l'image de gauche (oscillation continue) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }} // Animation d'apparition initiale
        whileInView={{ x: 0, opacity: 1 }} // Glisse en place
        // Combine toutes les animations et leurs transitions dans un seul 'animate'
        // et une seule propriété 'transition' globale pour ce composant
        animate={{
          x: 0, // S'assure qu'elle reste en place après l'apparition
          y: [0, -5, 0], // Oscillation : monte de 5px, puis redescend
        }}
        transition={{
          duration: 0.8, // Durée pour l'apparition initiale (x, opacity)
          ease: "easeOut",
          delay: 0.2, // Délai pour l'apparition

          // Propriétés pour l'oscillation continue
          y: {
            duration: 3, // Durée d'un cycle complet pour l'oscillation
            repeat: Infinity, // Répète l'animation indéfiniment
            ease: "easeInOut", // Doux au début et à la fin du mouvement
            delay: 0.5, // Démarre l'oscillation après l'apparition
          },
        }}
        viewport={{ once: true, amount: 0.5 }}
      >
        <Image
          className="max-w-56"
          src={assets.banner_bg1_image}
          alt="image_boîte_son_jbl"
        />
      </motion.div>

      {/* Contenu central (garde l'animation d'apparition et pulsation du bouton) */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.5 }}
        className="flex flex-col items-center justify-center text-center space-y-2 px-4 md:px-0 z-10 flex-grow" // flex-grow pour qu'il prenne l'espace central disponible
      >
        <h2 className="text-2xl md:text-3xl text-zinc-950 font-semibold max-w-[290px]">
          Un Étudiant, un Ordinateur Portable
        </h2>
        <p className="max-w-[343px] font-medium text-zinc-800/60">
          Mise à disposition d'ordinateurs portables modernes, puissants et
          adaptés aux défis technologiques actuels, le tout à un prix
          forfaitaire flexible.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }} // Grossit légèrement au survol
          whileTap={{ scale: 0.95 }} // Réduit légèrement au clic
          // Animation continue de pulsation
          animate={{ scale: [1, 1.02, 1] }} // Pulsation : grossit légèrement, puis revient à la taille normale
          transition={{
            duration: 1.5, // Durée d'un cycle de pulsation
            repeat: Infinity, // Répète l'animation indéfiniment
            ease: "easeInOut",
            delay: 1, // Démarre après que le bouton soit visible
          }}
          className="group flex items-center grid-cols-1 justify-center gap-1 px-12 py-2.5 bg-blue-600 hover:bg-blue-800 rounded text-zinc-50"
        >
          <a href="/offer">En savoir plus</a>
        </motion.button>
      </motion.div>

      {/* Animation pour l'image de droite (oscillation continue) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }} // Animation d'apparition initiale
        whileInView={{ x: 0, opacity: 1 }} // Glisse en place
        // Combine toutes les animations et leurs transitions dans un seul 'animate'
        animate={{
          x: 0, // S'assure qu'elle reste en place après l'apparition
          y: [0, 5, 0], // Oscillation : descend de 5px, puis remonte
        }}
        transition={{
          duration: 0.8, // Durée pour l'apparition initiale (x, opacity)
          ease: "easeOut",
          delay: 0.4, // Délai pour l'apparition
          // Propriétés pour l'oscillation continue
          y: {
            duration: 3, // Durée d'un cycle complet pour l'oscillation
            repeat: Infinity, // Répète l'animation indéfiniment
            ease: "easeInOut",
            delay: 0.7, // Démarre l'oscillation après l'apparition
          },
        }}
        viewport={{ once: true, amount: 0.5 }}
        className="hidden md:block"
      >
        <Image
          className="max-w-80"
          src={assets.banner_bg2_image}
          alt="image_manette_moyenne"
        />
      </motion.div>

      {/* Image mobile (vous pouvez ajouter une oscillation si vous le souhaitez) */}
      
    </div>
  );
};

export default Banner;