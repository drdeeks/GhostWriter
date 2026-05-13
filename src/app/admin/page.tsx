'use client';

import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/components/admin-dashboard').then(mod => mod.AdminDashboard), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  ),
});

export default function AdminPage() {
  return <AdminDashboard />;
}