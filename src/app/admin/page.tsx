import React, { Suspense } from 'react';

const AdminDashboard = React.lazy(() => import('@/components/admin/admin-dashboard').then((mod) => ({ default: mod.AdminDashboard })));

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading Admin Dashboard...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
