import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// Auth Pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Profile from '../pages/Auth/Profile';

// Dashboard Pages
import OverviewDashboard from '../pages/Dashboard/OverviewDashboard';
import AdminDashboard from '../pages/Dashboard/AdminDashboard';
import MemberDashboard from '../pages/Dashboard/MemberDashboard';

// Group Pages
import GroupList from '../pages/Groups/GroupList';
import GroupDetails from '../pages/Groups/GroupDetails';
import CreateGroup from '../pages/Groups/CreateGroup';
import EditGroup from '../pages/Groups/EditGroup';

// Payment Pages
import { PaymentsDashboard } from '../pages/Payments';

// Payout Pages
import { PayoutsDashboard } from '../pages/Payouts';

// Member Pages
import { MembersDashboard } from '../pages/Members';

// Report Pages
import { GroupLedger, MemberLedger, MonthlySummary, AuditLog, ReportsDashboard } from '../pages/Reports';

// Component Demo Pages (Development only)
import ComponentShowcase from '../components/ComponentShowcase';
import TestComponents from '../pages/TestComponents';

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

      {/* Dashboard Routes */}
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
        path="/groups/:groupId/dashboard"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:groupId/member-dashboard"
        element={
          <PrivateRoute>
            <MemberDashboard />
          </PrivateRoute>
        }
      />

      {/* Profile Route */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

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

      {/* Payment Routes */}
      <Route
        path="/payments"
        element={
          <PrivateRoute>
            <PaymentsDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/payments/history"
        element={
          <PrivateRoute>
            <PaymentsDashboard />
          </PrivateRoute>
        }
      />

      {/* Payout Routes */}
      <Route
        path="/payouts"
        element={
          <PrivateRoute>
            <PayoutsDashboard />
          </PrivateRoute>
        }
      />

      {/* Member Routes */}
      <Route
        path="/members"
        element={
          <PrivateRoute>
            <MembersDashboard />
          </PrivateRoute>
        }
      />

      {/* Report Routes */}
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <ReportsDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:groupId/ledger"
        element={
          <PrivateRoute>
            <GroupLedger />
          </PrivateRoute>
        }
      />
      <Route
        path="/members/:memberId/ledger"
        element={
          <PrivateRoute>
            <MemberLedger />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:groupId/summary"
        element={
          <PrivateRoute>
            <MonthlySummary />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:groupId/audit"
        element={
          <PrivateRoute>
            <AuditLog />
          </PrivateRoute>
        }
      />

      {/* Component Demo Routes (Development only - remove in production) */}
      <Route path="/showcase" element={<ComponentShowcase />} />
      <Route path="/test" element={<TestComponents />} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
