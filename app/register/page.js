'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Inscription réussie ! Redirection...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.message || 'Échec de l’inscription.');
      }
    } catch (err) {
      console.error('Erreur réseau ou inattendue:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      console.error('Erreur lors de l’inscription Google:', err);
      setError('Une erreur est survenue lors de l’inscription avec Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <FiUser className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Inscription</h2>
            <p className="text-gray-500 mt-2">
              Déjà membre ?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Connectez-vous ici
              </Link>
            </p>
          </div>

          {success && (
            <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start">
              <FiCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-green-700">{success}</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start">
              <FiAlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <div className="relative">
                  <FiUser className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    className="focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 block w-full py-3 pl-10 px-3 border rounded-md"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <div className="relative">
                  <FiUser className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    id="lastName"
                    className="focus:ring-blue-500 bg-zinc-100 focus:border-blue-500 block w-full py-3 pl-10 px-3 border rounded-md"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <FiMail className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  className="focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 block w-full py-3 pl-10 px-3 border-gray-300 rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <FiLock className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  className="focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 block w-full py-3 pl-10 px-3 border-gray-300 rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiArrowRight className="absolute left-3 h-5 w-5 text-blue-300 group-hover:text-blue-200" />
            S&#39;inscrire
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              className="mt-6 w-full inline-flex justify-center items-center py-3 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
