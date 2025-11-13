import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { GroupProvider } from './context/GroupContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <GroupProvider>
            <AppRoutes />
          </GroupProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;