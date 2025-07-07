'use client';
import React, { useEffect, useState, useCallback } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import { MoreHorizontal, Package } from 'lucide-react';
import { useSession } from 'next-auth/react';

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'DELIVERED':
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
    case 'PROCESSING':
    case 'ON_HOLD':
      return 'bg-orange-100 text-orange-800';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800';
    case 'CANCELLED':
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Orders = () => {
  const { url, formatPriceInFCFA } = useAppContext();
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllOrders = useCallback(async () => {
    if (status !== 'authenticated') {
      setLoading(false);
      setError("Vous devez être connecté pour voir les commandes.");
      return;
    }

    try {
      const response = await axios.get(`${url}/api/admin/orders`);
      if (response.status === 200 && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setError("Format de données inattendu.");
      }
    } catch (err) {
      setError("Erreur lors du chargement des commandes.");
    } finally {
      setLoading(false);
    }
  }, [url, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllOrders();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError("Non connecté. Veuillez vous connecter.");
    }
  }, [status, fetchAllOrders]);

  const formatFullDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 font-inter">
      <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <Package className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900">Gestion des Commandes</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow">
            <Loading />
          </div>
        ) : error ? (
          <div className="text-center bg-red-100 border border-red-300 text-red-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-3">Erreur</h2>
            <p>{error}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-transform duration-300 transform hover:scale-105"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-semibold text-gray-800">Toutes les Commandes Clients</h2>
            </div>

            {orders.length === 0 ? (
              <p className="text-gray-600 text-center p-10">Aucune commande trouvée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Client</th>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Articles</th>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Total</th>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Statut</th>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Livraison</th>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Paiement</th>
                      <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-blue-50 transition duration-150">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-gray-800">{order.userName || 'N/A'}</p>
                          <p className="text-gray-600">{order.userEmail || 'N/A'}</p>
                          <p className="text-gray-600">{order.userPhoneNumber || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-6">
                          {order.items?.length > 0 ? (
                            <ul className="space-y-1">
                              {order.items.map((item, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  {item.imgUrl && (
                                    <Image
                                      src={item.imgUrl}
                                      alt={item.name}
                                      width={30}
                                      height={30}
                                      className="rounded object-cover"
                                    />
                                  )}
                                  <span className="text-gray-700">{item.name} x {item.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500">Aucun</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">{formatPriceInFCFA(order.totalAmount)}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(order.orderStatus)}`}>
                            {order.orderStatus?.replace(/_/g, ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          <p>{order.shippingAddressLine1}</p>
                          {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                          <p>{`${order.shippingCity || ''}, ${order.shippingState || ''}`}</p>
                          <p>{`${order.shippingZipCode || ''}, ${order.shippingCountry || ''}`}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          <p className="font-medium">Méthode : {order.paymentMethod}</p>
                          <p>Statut :
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(order.paymentStatusDetail)}`}>
                              {order.paymentStatusDetail?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </p>
                          <p className="font-mono text-xs">ID: {order.paymentTransactionId || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                          {formatFullDateTime(order.orderDate)}
                        </td>
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

export default Orders;
