import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import TenantRegistration from './pages/TenantRegistration';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/tenant-login" replace />} />
          <Route path="/tenant-registration" element={<TenantRegistration />} />
          <Route path="/tenant-login" element={<Login />} />
          <Route
            path="/dashboard/:subdomain"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/tenant-login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
