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
// Dashboard Pages (Placeholder - will be created by Member 4)
// import AdminDashboard from '../pages/Dashboard/AdminDashboard';
// import MemberDashboard from '../pages/Dashboard/MemberDashboard';

// Group Pages
import GroupList from '../pages/Groups/GroupList';
import GroupDetails from '../pages/Groups/GroupDetails';
import CreateGroup from '../pages/Groups/CreateGroup';
import EditGroup from '../pages/Groups/EditGroup';

// Payment Pages (Placeholder - will be created by Member 3)
// import RecordPayment from '../pages/Payments/RecordPayment';
// import PaymentHistory from '../pages/Payments/PaymentHistory';

// Report Pages (Placeholder - will be created by Member 4)
// import GroupLedger from '../pages/Reports/GroupLedger';
// import MemberLedger from '../pages/Reports/MemberLedger';

// Temporary Dashboard Component (remove when Member 4 completes)
const TempDashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>Dashboard</h1>
    <p>Dashboard components will be added by Member 4</p>
  </div>
);

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
      {/* Group Routes - Uncomment when Member 2 completes */}
      {/* <Route path="/groups" element={<PrivateRoute><GroupList /></PrivateRoute>} />
      <Route path="/groups/create" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
      <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetails /></PrivateRoute>} /> */}
      {/* Group Routes */}
      <Route
        path="/groups"
        element={
          <PrivateRoute>
            <GroupList />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/create"
        element={
          <PrivateRoute>
            <CreateGroup />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:id"
        element={
          <PrivateRoute>
            <GroupDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:id/edit"
        element={
          <PrivateRoute>
            <EditGroup />
          </PrivateRoute>
        }
      />

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