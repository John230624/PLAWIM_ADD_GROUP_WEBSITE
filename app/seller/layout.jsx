'use client';

import React from 'react';
import Sidebar from '@/components/seller/Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex">
      {/* Sidebar qui défile à l’interne */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="flex-1 p-6 bg-zinc-50 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
