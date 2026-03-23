import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import TenantRegistration from "./pages/auth/TenantRegistration";
import Login from "./pages/auth/Login";

import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";

// INVENTORY MODULE
import Categories from "./pages/inventory/Category/Categories";
import CategoryForm from "./pages/inventory/Category/CategoryForm";

import ParentCategory from "./pages/inventory/Category/ParentCategoryForm";
import ParentCategoryList from "./pages/inventory/Category/ParentCategory";

import Products from "./pages/inventory/Product/Products";
import ProductForm from "./pages/inventory/Product/ProductForm";

import Warehouse from "./pages/inventory/warehouse/Warehouse";
import WarehouseForm from "./pages/inventory/warehouse/WarehouseForm";

import Stock from "./pages/inventory/stock/Stock";
import StockForm from "./pages/inventory/stock/StockForm";
import LowStock from "./pages/inventory/LowStock";
import Transfers from "./pages/inventory/Transfers";
import Movements from "./pages/inventory/Movements";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* AUTH */}
          <Route path="/" element={<Navigate to="/tenant-login" replace />} />
          <Route path="/tenant-registration" element={<TenantRegistration />} />
          <Route path="/tenant-login" element={<Login />} />

          {/* DASHBOARD */}
          <Route
            path="/dashboard/:subdomain"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* ── PRODUCTS ── */}
            <Route path="inventory/products"       element={<Products />} />
            <Route path="inventory/products/new"   element={<ProductForm />} />
            <Route path="inventory/products/:id"   element={<ProductForm />} />

            {/* ── WAREHOUSES ── */}
            <Route path="inventory/warehouses"     element={<Warehouse />} />
            <Route path="inventory/warehouses/new" element={<WarehouseForm />} />
            <Route path="inventory/warehouses/:id" element={<WarehouseForm />} />

            {/* ── PARENT CATEGORIES ── */}
            <Route path="inventory/parent-categories"       element={<ParentCategoryList />} />
            <Route path="inventory/parent-categories/new"   element={<ParentCategory />} />
            <Route path="inventory/parent-categories/:id"   element={<ParentCategory />} />

            {/* ── CATEGORIES ── */}
            <Route path="inventory/categories"     element={<Categories />} />
            <Route path="inventory/categories/new" element={<CategoryForm />} />
            <Route path="inventory/categories/:id" element={<CategoryForm />} />

            {/* ── STOCK ── */}
            <Route path="inventory/stock"          element={<Stock />} />
            <Route path="inventory/stock/add"      element={<StockForm />} />
            <Route path="inventory/stock/edit/:id" element={<StockForm />} />

            {/* ── OTHER INVENTORY ── */}
            {/* <Route path="inventory/low-stock"  element={<LowStock />} /> */}
            <Route path="inventory/transfers"  element={<Transfers />} />
            <Route path="inventory/movements"  element={<Movements />} />

          </Route>

          {/* FALLBACK */}
          <Route path="/dashboard" element={<Navigate to="/tenant-login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;