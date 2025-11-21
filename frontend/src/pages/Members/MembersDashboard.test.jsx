import React from 'react';
import { DashboardLayout } from '../../components/layout';
import useAuth from '../../hooks/useAuth';

const MembersDashboardTest = () => {
  const { user, logout } = useAuth();
  
  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div style={{ padding: '20px' }}>
        <h1>Members Dashboard Test</h1>
        <p>If you can see this, the route is working!</p>
      </div>
    </DashboardLayout>
  );
};

export default MembersDashboardTest;
