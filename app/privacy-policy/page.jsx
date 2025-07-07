import React from "react";
import { FaShieldAlt, FaUserSecret, FaLock } from "react-icons/fa";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-blue-50 min-h-screen py-10 px-6 md:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto bg-white p-10 rounded-2xl shadow-2xl border-t-4 border-blue-500">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Politique de Confidentialité</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Votre confidentialité est notre priorité. Découvrez comment nous protégeons vos informations personnelles.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <FaShieldAlt className="text-blue-500 text-3xl" />
              <h2 className="text-2xl font-bold text-gray-800">1. Collecte des informations</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Nous collectons vos informations personnelles lorsque vous utilisez notre site ou nos services. Cela peut inclure votre nom, adresse e-mail, numéro de téléphone, et d'autres détails fournis lors de la création d'un compte ou d'une commande.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <FaUserSecret className="text-blue-500 text-3xl" />
              <h2 className="text-2xl font-bold text-gray-800">2. Utilisation des informations</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Vos informations sont utilisées pour :
            </p>
            <ul className="list-disc list-inside text-gray-600 pl-6 space-y-2">
              <li>Traiter vos commandes et paiements.</li>
              <li>Fournir un service client personnalisé.</li>
              <li>Améliorer nos produits et services.</li>
              <li>Vous informer sur nos promotions et offres spéciales.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <FaLock className="text-blue-500 text-3xl" />
              <h2 className="text-2xl font-bold text-gray-800">3. Sécurité des données</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Nous utilisons des mesures techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou modification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Vos droits</h2>
            <p className="text-gray-600 leading-relaxed">
              Vous avez le droit d'accéder à vos données, de les corriger ou de demander leur suppression. Pour exercer ces droits, contactez-nous à :
            </p>
            <p className="text-gray-600 font-medium text-lg mt-2">plawimaddgroup1beninbranch@gmail.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Modifications de cette politique</h2>
            <p className="text-gray-600 leading-relaxed">
              Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Toute modification sera publiée sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Si vous avez des questions concernant cette politique, vous pouvez nous contacter à :
            </p>
            <p className="text-gray-600 font-medium text-lg">plawimaddgroup1beninbranch@gmail.com</p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
  Développé par Tiburce & Jean. &copy; {new Date().getFullYear()} Plawimadd Group. Tous droits réservés.
</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
