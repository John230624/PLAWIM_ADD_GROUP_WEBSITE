'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Loading from '@/components/Loading';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';

const COLORS = ['#6366F1', '#EC4899', '#3B82F6', '#F59E0B', '#10B981'];

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  linkHref,
  linkText,
  color,
}) => (
  <div
    className="rounded-3xl shadow-md p-7 border hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
    style={{
      background: `linear-gradient(135deg, ${color}33 0%, ${color}1A 100%)`,
      borderColor: color,
      color,
    }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8" style={{ color }} />}
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <span className="text-3xl font-extrabold text-gray-900">{value}</span>
    </div>
    <p className="text-gray-700 mb-5">{description}</p>
    {linkHref && linkText && (
      <Link
        href={linkHref}
        className="inline-flex items-center text-sm font-semibold group"
        style={{ color }}
      >
        {linkText}
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    )}
  </div>
);

const SellerDashboard = () => {
  const { formatPriceInFCFA } = useAppContext();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();

        if (res.ok && data.success) {
          setStats({
            totalProducts: data.totalProducts || 0,
            totalOrders: data.totalOrders || 0,
            pendingOrders: data.pendingOrders || 0,
            totalRevenue: data.totalRevenue || 0,
            totalUsers: data.totalUsers || 0,
          });
        } else {
          toast.error(data.message || 'Erreur lors du chargement des statistiques.');
        }
      } catch (error) {
        console.error('Erreur fetch stats:', error);
        toast.error('Impossible de récupérer les statistiques du tableau de bord.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-100 via-pink-100 to-yellow-100">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-indigo-50 via-pink-50 to-yellow-50">
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-12">
            Tableau de Bord Admin
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <StatCard
              title="Total Produits"
              value={stats.totalProducts}
              icon={Package}
              description="Nombre total de produits actifs."
              linkHref="/seller/product-list"
              linkText="Gérer les produits"
              color={COLORS[0]}
            />
            <StatCard
              title="Total Commandes"
              value={stats.totalOrders}
              icon={ShoppingCart}
              description="Nombre total de commandes effectuées."
              linkHref="/seller/orders"
              linkText="Voir les commandes"
              color={COLORS[1]}
            />
            <StatCard
              title="Commandes en Attente"
              value={stats.pendingOrders}
              icon={ShoppingCart}
              description="Commandes non encore traitées."
              linkHref="/seller/orders?status=pending"
              linkText="Commandes en attente"
              color={COLORS[2]}
            />
            <StatCard
              title="Revenu Total"
              value={formatPriceInFCFA(stats.totalRevenue)}
              icon={DollarSign}
              description="Revenu généré par vos ventes."
              linkHref="/seller/reports"
              linkText="Voir les rapports"
              color={COLORS[4]}
            />
            <StatCard
              title="Utilisateurs Enregistrés"
              value={stats.totalUsers}
              icon={Users}
              description="Nombre de clients enregistrés."
              linkHref="/seller/users"
              linkText="Voir les utilisateurs"
              color={COLORS[3]}
            />
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Activité Récente
            </h3>
            <p className="text-gray-600 text-base font-medium">
              Aucune activité récente pour le moment.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
