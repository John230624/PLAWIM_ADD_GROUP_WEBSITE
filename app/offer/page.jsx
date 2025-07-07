"use client";
import React from "react";
import Footer from "@/components/Footer";
import backgroundImage from "@/assets/bg2.jpg";
import backgroundImage2 from "@/assets/bg6.jpg";
const OfferPageContent = () => {
  return (
    <>
      <div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen">
        {/* Section Hero - Titre principal et sous-titre */}
        <section
          className="text-white py-20 sm:py-24 text-center relative overflow-hidden shadow-lg"
          style={{
            backgroundImage: `url(${backgroundImage.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "calc(90vh - 90px)", // Prend toute la hauteur d'écran moins un offset
            minHeight: "300px", // Hauteur minimum sur petits écrans
          }}
        >
          {/* Overlay sombre pour améliorer la lisibilité du texte */}
          <div className="absolute inset-0 bg-black opacity-40 z-0"></div>

          <div className="max-w-5xl mx-auto px-6 relative pt-11 z-10 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight drop-shadow-md">
              Un Étudiant, un Ordinateur Portable
            </h1>
            <p className="text-lg sm:text-xl text-zinc-50 max-w-3xl mx-auto opacity-90">
              Mise à disposition d'ordinateurs portables modernes, puissants et
              adaptés aux défis technologiques actuels, le tout à un prix
              forfaitaire flexible.
            </p>
            <div className="mt-8 pt-20">
              <a
                href="#payment-methods"
                className="inline-block bg-blue-900 text-zinc-50 hover:text-zinc-950 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-100 transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Découvrir nos solutions de paiement
              </a>
            </div>
          </div>
        </section>
        {/* Section principale du contenu - Deux colonnes sur les grands écrans */}
        <section className="container mx-auto px-6 py-6 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12 lg:gap-16 items-start">
            {/* Colonne de gauche: Description détaillée de l'offre */}
            <div className="space-y-10 animate-fade-in-left">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 border-b-4 border-blue-500 pb-2">
                Notre Mission
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-400">
                Ce projet vise à offrir une solution informatique complète,
                parfaitement adaptée aux besoins académiques et professionnels
                des étudiants, tout en tenant compte de leur budget. Grâce à des
                modalités de paiement innovantes et flexibles et un service
                après-vente de qualité supérieure, notre initiative se
                positionne comme un pilier de soutien pour la communauté
                estudiantine. Nous proposons une gamme soigneusement
                sélectionnée d'ordinateurs portatifs avec des configurations
                optimisées pour la bureautique, le travail collaboratif, la
                recherche, et l'utilisation fluide de logiciels spécialisés
                (design graphique, ingénierie, développement, etc.). Chaque
                ordinateur est accompagné d'un service après-vente fiable avec
                une garantie solide de
                <span className="font-bold text-blue-600"> 1 à 2 ans</span>,
                pour une tranquillité d'esprit totale.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-blue-800 mb-4">
                  Accessoires offerts avec chaque achat :
                </h3>
                <ul className="list-disc list-inside text-blue-700 space-y-3 text-lg">
                  <li className="flex items-center">
                    <span className="text-blue-600 mr-2">✓</span> Sac à dos de
                    qualité, résistant et stylé
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-600 mr-2">✓</span> Souris
                    ergonomique pour un confort optimal
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-600 mr-2">✓</span> Casque audio
                    performant pour vos études et loisirs
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-6 py-3 lg:py-6">
          <div id="payment-methods" className="animate-fade-in-right">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-8 pb-4 border-b-4 border-blue-500">
              Modalités de Paiement Accessibles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Modalité 1 */}
              <div className="flex items-start space-x-6 bg-white p-8 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 p-4 bg-green-100 rounded-full text-green-600 shadow-inner">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Paiement échelonné flexible
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Choisissez l'option qui vous convient le mieux : paiement en{" "}
                    <strong>3, 6 ou 10 tranches</strong> sans frais
                    supplémentaires. Simplifiez la gestion de votre budget !
                  </p>
                </div>
              </div>

              {/* Modalité 2 */}
              <div className="flex items-start space-x-6 bg-white p-8 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 p-4 bg-purple-100 rounded-full text-purple-600 shadow-inner">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Abonnement avec option d'achat (LOA)
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Profitez de mensualités avantageuses avec la{" "}
                    <strong>
                      possibilité exclusive de devenir propriétaire
                    </strong>{" "}
                    de votre ordinateur à la fin du contrat. Une flexibilité
                    inégalée !
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Modalité 3 */}
              <div className="flex items-start space-x-6 bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 p-4 bg-red-100 rounded-full text-red-600 shadow-inner">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 14V7m0 0l-3 3m3-3l3 3m6 4h4a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2h4"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Réduction spéciale pour boursiers
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Bénéficiez de remises significatives (à hauteur de{" "}
                    <strong>XX</strong>) si vous êtes étudiant boursier ou issu
                    d'une famille aux revenus modestes. Une aide concrète sur
                    présentation de votre preuve d'éligibilité.
                  </p>
                </div>
              </div>

              {/* Modalité 4 */}
              <div className="flex items-start space-x-6 bg-white p-8 rounded-xl shadow-lg border-l-4 border-teal-500 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 p-4 bg-teal-100 rounded-full text-teal-600 shadow-inner">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Distribution en collaboration avec les établissements
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Nous travaillons en concertation avec les administrations de
                    votre établissement pour une attribution directe
                    d'ordinateurs aux étudiants boursiers, avec un remboursement
                    facilité dès réception de leurs allocations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Section Appel à l'action ou FAQ rapide (optionnel mais professionnel) */}
        <section
          className="bg-blue-600 text-white text-center py-16 mt-16 shadow-inner"
          style={{
            backgroundImage: `url(${backgroundImage2.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "calc(40vh - 40px)", // Prend toute la hauteur d'écran moins un offset
            minHeight: "40px", // Hauteur minimum sur petits écrans
          }}
        >
          <div className=" max-w-4xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Prêt à acquérir votre outil de réussite ?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              N'hésitez pas à nous contacter pour discuter de la meilleure
              option pour vous.
            </p>
            <a
              href="/contact"
              className="inline-block bg-blue-900 text-zinc-50 font-bold py-4 px-10 rounded-full shadow-xl hover:text-zinc-950 hover:bg-blue-100 transition duration-300 ease-in-out transform hover:scale-105"
            >
              Contactez-nous
            </a>
          </div>
        </section>
      </div>
      <div>
        <Footer />
      </div>
    </>
  );
};

export default OfferPageContent;
