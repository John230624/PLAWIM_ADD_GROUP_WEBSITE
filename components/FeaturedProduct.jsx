"use client";
import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { motion } from "framer-motion";

const products = [
  {
    id: 1,
    image: assets.girl_with_headphone_image,
    title: "Un son inégalé",
    description: "Profitez d'un son cristallin avec des casques haut de gamme.",
  },
  {
    id: 2,
    image: assets.girl_with_earphone_image,
    title: "Restez connecté",
    description: "Des écouteurs compacts et élégants pour toutes les occasions.",
  },
  {
    id: 3,
    image: assets.boy_with_laptop_image,
    title: "Puissance à chaque pixel",
    description: "Découvrez les derniers ordinateurs portables pour le travail, le jeu et plus encore.",
  },
];

const FeaturedProduct = () => {
  const headingVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const textContentVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    hover: { y: -16 },
  };

  return (
    <div className="mt-14">
      <div className="flex flex-col items-center">
        <motion.p
          className="text-3xl font-medium"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={headingVariants}
        >
          Publicité
        </motion.p>
        <motion.div
          className="w-28 h-0.5 bg-blue-600 mt-2"
          initial={{ width: 0, opacity: 0 }}
          whileInView={{ width: 112, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        ></motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4">
        {products.map(({ id, image, title, description }, index) => (
          <motion.div
            key={id}
            className="relative group overflow-hidden rounded-lg shadow-lg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            transition={{ delay: index * 0.2 + 0.5 }}
            whileHover={{
              scale: 1.03,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
          >
            <Image
              src={image}
              alt={title}
              className="group-hover:brightness-75 transition duration-300 w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8 pb-10">
              <motion.div
                className="text-white space-y-2 w-full"
                initial="hidden"
                whileInView="visible"
                variants={textContentVariants}
              >
                <p className="font-medium text-xl lg:text-2xl">{title}</p>
                <p className="text-sm lg:text-base leading-5 max-w-60">{description}</p>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;
