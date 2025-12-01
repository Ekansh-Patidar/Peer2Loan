import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './DashboardLayout.css';

const DashboardLayout = ({ children, user, onLogout }) => {
  return (
    <div className="dashboard-layout">
      <Header user={user} onLogout={onLogout} />

      <div className="dashboard-layout-body">
        <main className="dashboard-layout-main">
          <div className="dashboard-layout-content">
            {children}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
