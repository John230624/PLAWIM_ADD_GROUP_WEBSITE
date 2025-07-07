'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Box, ShoppingCart, Users } from 'lucide-react';

const menuItems = [
  { name: 'Rapport', path: '/seller', icon: BarChart2 },
  { name: 'Gérer Produits', path: '/seller/product-list', icon: Box },
  { name: 'Gérer Commandes', path: '/seller/orders', icon: ShoppingCart },
   { name: 'Clients', path: '/seller/users', icon: Users },
];

const SideBar = () => {
  const pathname = usePathname();

  return (
    <aside className="bg-white border-r min-h-screen py-6 px-3 md:w-64 w-20 shadow-sm">
      <h2 className="text-center text-lg font-semibold text-blue-600 mb-6 hidden md:block">
        Tableau de bord
      </h2>

      <nav className="flex flex-col gap-3">
        {menuItems.map(({ name, path, icon: Icon }) => {
          const isActive = pathname === path;

          return (
            <Link href={path} key={name} passHref>
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden md:inline text-sm">{name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideBar;
