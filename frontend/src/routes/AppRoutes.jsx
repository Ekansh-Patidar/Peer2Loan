import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// Auth Pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Profile from '../pages/Auth/Profile';

// Component Demo Pages
import ComponentShowcase from '../components/ComponentShowcase';
import TestComponents from '../pages/TestComponents';

// Dashboard Pages
import { AdminDashboard, MemberDashboard, OverviewDashboard } from '../pages/Dashboard';

// Group Pages
import { GroupsDashboard } from '../pages/Groups';

// Payment Pages
import { PaymentsDashboard } from '../pages/Payments';

// Report Pages
import { GroupLedger, MemberLedger, MonthlySummary, AuditLog, ReportsDashboard } from '../pages/Reports';

// Member Pages
import { MembersDashboard } from '../pages/Members';

// Payout Pages
import { PayoutsDashboard } from '../pages/Payouts';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Private Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <OverviewDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <OverviewDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      {/* Component Demo Routes */}
      <Route path="/showcase" element={<ComponentShowcase />} />
      <Route path="/test" element={<TestComponents />} />

      {/* Group Routes */}
      <Route path="/groups" element={<PrivateRoute><GroupsDashboard /></PrivateRoute>} />

      {/* Payment Routes */}
      <Route path="/payments" element={<PrivateRoute><PaymentsDashboard /></PrivateRoute>} />
      <Route path="/payments/history" element={<PrivateRoute><PaymentsDashboard /></PrivateRoute>} />

      {/* Dashboard Routes */}
      <Route path="/groups/:groupId/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="/groups/:groupId/member-dashboard" element={<PrivateRoute><MemberDashboard /></PrivateRoute>} />

      {/* Member Routes */}
      <Route path="/members" element={<PrivateRoute><MembersDashboard /></PrivateRoute>} />

      {/* Payout Routes */}
      <Route path="/payouts" element={<PrivateRoute><PayoutsDashboard /></PrivateRoute>} />

      {/* Report Routes */}
      <Route path="/reports" element={<PrivateRoute><ReportsDashboard /></PrivateRoute>} />
      <Route path="/groups/:groupId/ledger" element={<PrivateRoute><GroupLedger /></PrivateRoute>} />
      <Route path="/members/:memberId/ledger" element={<PrivateRoute><MemberLedger /></PrivateRoute>} />
      <Route path="/groups/:groupId/summary" element={<PrivateRoute><MonthlySummary /></PrivateRoute>} />
      <Route path="/groups/:groupId/audit" element={<PrivateRoute><AuditLog /></PrivateRoute>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;