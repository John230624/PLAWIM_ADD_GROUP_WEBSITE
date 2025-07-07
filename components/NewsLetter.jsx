import React from "react";

const NewsLetter = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20 bg-gray-50">
      {" "}
      {/* Added background and increased vertical padding */}
      <div className="max-w-2xl mx-auto">
        {" "}
        {/* Centered content and limited max-width */}
        <h1 className="text-1xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
          {" "}
          {/* Enhanced headline */}
           {" "}
          <span className="text-blue-600">Abonnez-vous </span>
          pour ne rien rater
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-10">
          {" "}
          {/* Improved paragraph styling */}
          Recevez les dernières nouvelles et offres exclusives directement dans
          votre boîte mail.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-md mx-auto space-y-4 sm:space-y-0 sm:space-x-2">
          {" "}
          {/* Responsive input/button container */}
          <input
            className="w-full flex-grow border border-gray-300 rounded-lg h-12 px-4 text-gray-800 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out shadow-sm" /* Professional input style */
            type="email" // Changed type to email for better validation
            placeholder="Entrez votre adresse e-mail"
            aria-label="Adresse e-mail" // Added accessibility label
          />{" "}
          {/* Corrected: Self-closing tag moved to the end of all attributes */}
          <button className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out shadow-md">
            {" "}
            {/* Professional button style */}
            S'abonner
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsLetter;
