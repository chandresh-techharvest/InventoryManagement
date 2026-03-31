import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import TenantRegistration from './pages/auth/TenantRegistration';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import Categories from './pages/inventory/Category/Categories';
import CategoryForm from './pages/inventory/Category/CategoryForm';
import Products from './pages/inventory/Product/Products';
import ProductForm from './pages/inventory/Product/ProductForm';
import Stock from './pages/inventory/Stock';
import LowStock from './pages/inventory/LowStock';
import Transfers from './pages/inventory/Transfers';
import ParentCategory from './pages/inventory/Category/ParentCategoryForm';
import ParentCategoryList from './pages/inventory/Category/ParentCategory';
import Warehouse from './pages/inventory/warehouse/Warehouse';
import WarehouseForm from './pages/inventory/warehouse/WarehouseForm';
import Suppliers from './pages/Purchases/Suppliers/Suppliers';
import SupplierForm from './pages/Purchases/Suppliers/SupplierForm';
import PurchaseOrders from './pages/Purchases/PurchaseOrders/PurchaseOrders';
import PurchaseOrderForm from './pages/Purchases/PurchaseOrders/PurchaseOrderForm';
import PurchaseOrderDetail from './pages/Purchases/PurchaseOrders/PurchaseOrderDetail';

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

            {/* WAREHOUSE */}
            <Route path="warehouses" element={<Warehouse />} />
            <Route path="warehouses/new" element={<WarehouseForm />} />
            <Route path="warehouses/:id" element={<WarehouseForm />} />

            {/* INVENTORY */}
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />

            {/* PARENT CATEGORIES */}
            <Route path="parent-categories" element={<ParentCategoryList />} />
            <Route path="parent-categories/new" element={<ParentCategory />} />
            <Route path="parent-categories/:id/edit" element={<ParentCategory />} />

            {/* CATEGORY */}
            <Route path="categories" element={<Categories />} />
            <Route path="categories/new" element={<CategoryForm />} />
            <Route path="categories/:id/edit" element={<CategoryForm />} />


            {/* <Route path="stock" element={<Stock />} />
            <Route path="lowStock" element={<LowStock />} />
            <Route path="transfers" element={<Transfers />} /> */}



            {/* Purchases */}
            {/* Purchase Orders */}
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="purchase-orders/new" element={<PurchaseOrderForm/>} />
              <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />

            {/* Suppliers */}
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/new" element={<SupplierForm />} />
            <Route path="suppliers/:id" element={<SupplierForm />} />

          </Route>
          <Route path="/dashboard" element={<Navigate to="/tenant-login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
