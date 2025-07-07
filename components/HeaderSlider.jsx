"use client";
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const HeaderSlider = () => {
  const sliderData = [
    {
      id: 1,
      title:
        "Puissant, rapide et conçu pour répondre à vos besoins professionnels et de divertissement !",
      offer: "Offre limitée",
      buttonText2: "Acheter maintenant",
      imgSrc: assets.header_ordi_hp_probook_image,
    },
    {
      id: 2,
      title:
        "Plongez dans une expérience visuelle immersive avec une image ultra haute définition !",
      offer: "Dépêchez-vous, nous sommes en promotion !",
      buttonText2: "Voir les offres",
      imgSrc: assets.header_tv_image,
    },
    {
      id: 3,
      title: "Profitez d’un son clair et riche, idéal pour la musique et les appels !",
      offer: "Offre exclusive : 40 % de réduction",
      buttonText2: "En savoir plus",
      imgSrc: assets.header_casque_image,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide effect (20 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 20000); // 20 secondes
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  // Variantes animation texte
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      },
    },
  };

  // Variantes animation image
  const imageVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.3,
      },
    },
    exit: {
      opacity: 0,
      x: -50,
      scale: 0.9,
      transition: {
        duration: 0.5,
        ease: "easeIn",
      },
    },
  };

  // Variantes animation bouton
  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.5,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      },
    },
  };

  return (
    <div className="overflow-hidden relative w-full">
      <motion.div
        className="flex"
        animate={{ x: `-${currentSlide * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className="flex flex-col-reverse md:flex-row items-center justify-between bg-zinc-100 py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide + "-text"}
                className="md:pl-8 mt-10 md:mt-0 flex flex-col items-center md:items-start text-center md:text-left z-10"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={textVariants}
              >
                <motion.p
                  className="md:text-lg text-blue-500 font-semibold mb-2"
                  variants={textVariants}
                >
                  {slide.offer}
                </motion.p>

                <motion.h1
                  className="max-w-xl text-zinc-700 md:text-4xl text-2xl font-extrabold leading-snug"
                  variants={textVariants}
                  transition={{ ...textVariants.visible.transition, delay: 0.1 }}
                >
                  {slide.title}
                </motion.h1>

                <motion.div
                  className="flex items-center mt-4 md:mt-6"
                  variants={buttonVariants}
                >
                  <a href="/all-products" tabIndex={0}>
                    <motion.button
                      whileHover={{ scale: 1.07 }}
                      whileTap={{ scale: 0.95 }}
                      className="group flex items-center gap-3 md:px-12 px-8 md:py-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg transition-shadow"
                    >
                      {slide.buttonText2}
                      <Image
                        className="group-hover:translate-x-1 transition-transform"
                        src={assets.arrow_icon}
                        alt="icône flèche"
                        width={20}
                        height={20}
                      />
                    </motion.button>
                  </a>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide + "-image"}
                className="flex items-center flex-1 justify-center md:justify-end"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={imageVariants}
              >
                <Image
                  className="md:w-72 w-48"
                  src={slide.imgSrc}
                  alt={`Slide ${index + 1}`}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((_, index) => (
          <motion.div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-2 w-2 rounded-full cursor-pointer`}
            whileHover={{ scale: 1.2 }}
            animate={{
              backgroundColor: currentSlide === index ? "#3B82F6" : "#E5E7EB", // blue-500 / zinc-200
              scale: currentSlide === index ? 1.2 : 1,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            role="button"
            tabIndex={0}
            aria-label={`Aller à la diapositive ${index + 1}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSlideChange(index);
            }}
          ></motion.div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
