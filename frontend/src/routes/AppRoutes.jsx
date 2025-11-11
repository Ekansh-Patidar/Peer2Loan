import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// Auth Pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Profile from '../pages/Auth/Profile';

// Dashboard Pages (Placeholder - will be created by Member 4)
// import AdminDashboard from '../pages/Dashboard/AdminDashboard';
// import MemberDashboard from '../pages/Dashboard/MemberDashboard';

// Group Pages (Placeholder - will be created by Member 2)
// import GroupList from '../pages/Groups/GroupList';
// import GroupDetails from '../pages/Groups/GroupDetails';
// import CreateGroup from '../pages/Groups/CreateGroup';

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
            <TempDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <TempDashboard />
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

      {/* Group Routes - Uncomment when Member 2 completes */}
      {/* <Route path="/groups" element={<PrivateRoute><GroupList /></PrivateRoute>} />
      <Route path="/groups/create" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
      <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetails /></PrivateRoute>} /> */}

      {/* Payment Routes - Uncomment when Member 3 completes */}
      {/* <Route path="/payments" element={<PrivateRoute><RecordPayment /></PrivateRoute>} />
      <Route path="/payments/history" element={<PrivateRoute><PaymentHistory /></PrivateRoute>} /> */}

      {/* Report Routes - Uncomment when Member 4 completes */}
      {/* <Route path="/reports/group/:groupId" element={<PrivateRoute><GroupLedger /></PrivateRoute>} />
      <Route path="/reports/member/:memberId" element={<PrivateRoute><MemberLedger /></PrivateRoute>} /> */}

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;