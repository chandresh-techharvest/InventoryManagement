import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import TenantRegistration from './pages/auth/TenantRegistration';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import Categories from './pages/inventory/Categories';
import Products from './pages/inventory/Product/Products';
import ProductForm from './pages/inventory/Product/ProductForm';
import Stock from './pages/inventory/Stock';
import LowStock from './pages/inventory/LowStock';
import Transfers from './pages/inventory/Transfers';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/tenant-login" replace />} />
          <Route path="/tenant-registration" element={<TenantRegistration />} />
          <Route path="/tenant-login" element={<Login />} />
          {/* <Route path="/stock" element={<Stock />} />
          <Route path="/low-stock" element={<LowStock />} />
          <Route path="/transfers" element={<Transfers />} /> */}
          <Route
            path="/dashboard/:subdomain"
            element={
              <ProtectedRoute>
                <DashboardLayout/>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* INVENTORY */}
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            {/* <Route path="stock" element={<Stock />} />
            <Route path="lowStock" element={<LowStock />} />
            <Route path="transfers" element={<Transfers />} /> */}
          </Route>
          <Route path="/dashboard" element={<Navigate to="/tenant-login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
