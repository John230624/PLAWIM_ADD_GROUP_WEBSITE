'use client';

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Loading from "@/components/Loading";
import Footer from "@/components/seller/Footer";
import axios from "axios";
import { useSession } from 'next-auth/react';
import { Users, CalendarDays, Mail, UserRound } from 'lucide-react';
import { useAppContext } from "@/context/AppContext";

const UserManagement = () => {
  const { url } = useAppContext();
  const { data: session, status } = useSession();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllUsers = useCallback(async () => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || session?.user?.role?.toLowerCase() !== 'admin') {
      setLoading(false);
      setError("Accès non autorisé. Vous devez être connecté en tant qu'administrateur.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${url}/api/admin/users?role=user`);
      if (response.status === 200 && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setError("Format de données inattendu ou API indisponible.");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          setError("Accès interdit. Permissions insuffisantes.");
        } else {
          setError(`Erreur serveur : ${err.response.data?.message || 'Chargement impossible.'}`);
        }
      } else {
        setError("Erreur réseau ou inattendue.");
      }
    } finally {
      setLoading(false);
    }
  }, [url, status, session]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const formatFullDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 font-inter">
      <main className="flex-1 p-4 md:p-8 lg:p-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Users className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Gestion des Utilisateurs</h1>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold shadow-md">
            Total : {users.length} client{users.length > 1 && 's'}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-lg">
            <Loading />
          </div>
        ) : error ? (
          <div className="text-center bg-red-100 border border-red-300 text-red-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-3">Erreur de Chargement</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => error.includes("connecté") ? window.location.href = '/login' : fetchAllUsers()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-transform duration-200 hover:scale-105"
            >
              {error.includes("connecté") ? 'Se connecter' : 'Réessayer'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <UserRound className="w-6 h-6 text-gray-600" /> Utilisateurs Enregistrés
              </h2>
              <span className="text-sm text-gray-500">Dernière mise à jour : {new Date().toLocaleDateString()}</span>
            </div>
            {users.length === 0 ? (
              <p className="text-gray-600 text-center p-10 text-lg">
                <span className="block mb-2">😔</span> Aucun utilisateur trouvé.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-4 px-6 text-left">Nom</th>
                      <th className="py-4 px-6 text-left">Email</th>
                      <th className="py-4 px-6 text-left">Date d'inscription</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-700">{user.email || 'N/A'}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-gray-600">{formatFullDateTime(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default UserManagement;
