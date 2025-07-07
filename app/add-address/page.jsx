'use client';
import { assets } from "@/assets/assets";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from 'react-toastify';
import { FiUser, FiPhone, FiMapPin, FiHome, FiNavigation, FiMail, FiSave } from 'react-icons/fi';
import { IoLocationOutline } from 'react-icons/io5';

const AddAddress = () => {
    const { currentUser, setCurrentUser, url, fetchUserAddresses } = useAppContext(); 
    const router = useRouter();
    const { data: session, status } = useSession();

    const [address, setAddress] = useState({
        fullName: '',
        phoneNumber: '',
        pincode: '',
        area: '',
        city: '',
        state: '',
    });
    const [message, setMessage] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (status === 'authenticated' && session?.user) {
            setCurrentUser({ 
                id: session.user.id || session.user.email, 
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                token: session.user.token,
                role: session.user.role,
            });
        } else if (status === 'unauthenticated') {
            setCurrentUser(null); 
        }
    }, [session, status, setCurrentUser]);

    const onChangeHandler = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!currentUser || !currentUser.id) {
            setMessage("Erreur: Utilisateur non connecté. Redirection vers la page de connexion...");
            toast.error("Veuillez vous connecter pour ajouter une adresse.");
            router.push('/login');
            return;
        }

        if (!address.fullName || !address.phoneNumber || !address.area || !address.city || !address.state) {
            setMessage("Erreur: Veuillez remplir tous les champs obligatoires (Nom complet, Numéro de téléphone, Adresse, Ville, Région).");
            toast.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (currentUser.token) headers['auth-token'] = currentUser.token;

            const response = await axios.post(
                `${url}/api/addresses/${currentUser.id}`,
                { ...address },
                { headers }
            );

            const data = response.data;

            if (response.status === 201 && data.success) {
                setMessage(data.message || "Adresse ajoutée avec succès !");
                toast.success(data.message || "Adresse ajoutée avec succès !");
                setAddress({
                    fullName: '',
                    phoneNumber: '',
                    pincode: '',
                    area: '',
                    city: '',
                    state: '',
                });
                fetchUserAddresses();
                router.push('/cart');
            } else {
                setMessage(`Erreur: ${data.message || "Échec de l'ajout de l'adresse."}`);
                toast.error(`Erreur: ${data.message || "Échec de l'ajout de l'adresse."}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'adresse:', error);
            if (error.response) {
                setMessage(`Erreur: ${error.response.data.message || 'Problème serveur.'}`);
                toast.error(`Erreur: ${error.response.data.message || 'Problème serveur.'}`);
            } else if (error.request) {
                setMessage('Erreur: Pas de réponse du serveur. Vérifiez votre connexion.');
                toast.error('Erreur: Pas de réponse du serveur.');
            } else {
                setMessage(`Erreur inattendue: ${error.message}`);
                toast.error(`Erreur inattendue: ${error.message}`);
            }
        }
    };

    if (!isClient || status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-100">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden md:flex">
                        <div className="md:w-1/2 p-10 md:p-16">
                            <div className="flex items-center mb-8">
                                <IoLocationOutline className="text-blue-600 text-4xl mr-4" />
                                <h1 className="text-3xl font-extrabold text-gray-900">
                                    Ajouter une <span className="text-blue-600">Adresse</span>
                                </h1>
                            </div>
                            
                            <form onSubmit={onSubmitHandler} className="space-y-6">
                                {[
                                    { name: 'fullName', placeholder: 'Nom complet', Icon: FiUser, required: true, type: 'text' },
                                    { name: 'phoneNumber', placeholder: 'Numéro de téléphone', Icon: FiPhone, required: true, type: 'tel' },
                                    { name: 'pincode', placeholder: 'Code postal ', Icon: FiMapPin, required: false, type: 'text' },
                                ].map(({name, placeholder, Icon, required, type}) => (
                                    <div key={name} className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Icon className="text-gray-400" size={20} />
                                        </div>
                                        <input
                                            type={type}
                                            name={name}
                                            placeholder={placeholder}
                                            value={address[name]}
                                            onChange={onChangeHandler}
                                            required={required}
                                            className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                        />
                                    </div>
                                ))}

                                <div className="relative">
                                    <div className="absolute top-3 left-4 flex items-start pointer-events-none">
                                        <FiHome className="text-gray-400" size={20} />
                                    </div>
                                    <textarea
                                        name="area"
                                        placeholder="Adresse"
                                        rows={4}
                                        value={address.area}
                                        onChange={onChangeHandler}
                                        required
                                        className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { name: 'city', placeholder: 'Ville', Icon: FiNavigation, required: true },
                                        { name: 'state', placeholder: 'Région', Icon: FiMail, required: true },
                                    ].map(({name, placeholder, Icon, required}) => (
                                        <div key={name} className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Icon className="text-gray-400" size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                name={name}
                                                placeholder={placeholder}
                                                value={address[name]}
                                                onChange={onChangeHandler}
                                                required={required}
                                                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {message && (
                                    <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
                                        message.startsWith('Erreur')
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {message}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                                    text-white font-semibold py-3 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
                                >
                                    <FiSave size={20} />
                                    <span>Enregistrer l'adresse</span>
                                </button>
                            </form>
                        </div>

                        <div className="hidden md:flex md:w-1/2 bg-blue-50 items-center justify-center p-12">
                            <div className="text-center">
                                <Image
                                    src={assets.my_location_image}
                                    alt="Image de localisation"
                                    width={400}
                                    height={400}
                                    className="mx-auto rounded-xl shadow-lg"
                                    priority
                                />
                                <h3 className="mt-8 text-2xl font-semibold text-gray-800">Votre adresse est importante</h3>
                                <p className="mt-3 text-gray-600 max-w-sm mx-auto">
                                    Nous avons besoin de votre adresse pour vous livrer vos commandes et vous offrir la meilleure expérience possible.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AddAddress;
