import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { GroupProvider } from './context/GroupContext';
import { PaymentProvider } from './context/PaymentContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <GroupProvider>
            <PaymentProvider>
              <AppRoutes />
            </PaymentProvider>
          </GroupProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
