import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import TenantRegistration from "./pages/auth/TenantRegistration";
import Login from "./pages/auth/Login";

import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import ProfileLayout from "./layouts/ProfileLayout";       // ← NEW

// INFO MODULE
import Profile  from "./pages/profile/Profile";
// import Settings from "./pages/settings/Settings";

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
import Transfers from "./pages/inventory/Transfers";
import Movements from "./pages/inventory/Movements";

// PURCHASES MODULE
import PurchaseOrders from "./pages/purchases/PurchaseOrders/PurchaseOrders";
import PurchaseOrderForm from "./pages/purchases/PurchaseOrders/PurchaseOrderForm";

import Suppliers from "./pages/purchases/Suppliers/Suppliers";
import SupplierForm from "./pages/purchases/Suppliers/SupplierForm";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── AUTH ── */}
          <Route path="/" element={<Navigate to="/tenant-login" replace />} />
          <Route path="/tenant-registration" element={<TenantRegistration />} />
          <Route path="/tenant-login" element={<Login />} />

          {/* ── DASHBOARD LAYOUT (sidebar + navbar) ── */}
          <Route path="/company/:subdomain" element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>

              <Route index element={<Navigate to="dashboard" replace />} />

              {/* DASHBOARD */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* INVENTORY */}
              <Route path="inventory/products"              element={<Products />} />
              <Route path="inventory/products/new"          element={<ProductForm />} />
              <Route path="inventory/products/:id"          element={<ProductForm />} />

              <Route path="inventory/warehouses"            element={<Warehouse />} />
              <Route path="inventory/warehouses/new"        element={<WarehouseForm />} />
              <Route path="inventory/warehouses/:id"        element={<WarehouseForm />} />

              <Route path="inventory/categories"            element={<Categories />} />
              <Route path="inventory/categories/new"        element={<CategoryForm />} />
              <Route path="inventory/categories/:id"        element={<CategoryForm />} />

              <Route path="inventory/parent-categories"     element={<ParentCategoryList />} />
              <Route path="inventory/parent-categories/new" element={<ParentCategory />} />
              <Route path="inventory/parent-categories/:id" element={<ParentCategory />} />

              <Route path="inventory/stock"                 element={<Stock />} />
              <Route path="inventory/stock/add"             element={<StockForm />} />
              <Route path="inventory/stock/edit/:id"        element={<StockForm />} />

              <Route path="inventory/transfers"             element={<Transfers />} />
              <Route path="inventory/movements"             element={<Movements />} />

              {/* PURCHASES */}
              <Route path="purchases/purchase-orders"       element={<PurchaseOrders />} />
              <Route path="purchases/purchase-orders/new"   element={<PurchaseOrderForm />} />
              <Route path="purchases/purchase-orders/:id"   element={<PurchaseOrderForm />} />

              <Route path="purchases/suppliers"             element={<Suppliers />} />
              <Route path="purchases/suppliers/new"         element={<SupplierForm />} />
              <Route path="purchases/suppliers/:id"         element={<SupplierForm />} />

            </Route>
          </Route>

          {/* ── PROFILE LAYOUT (no sidebar — clean full page) ── */}
          <Route path="/company/:subdomain" element={<ProtectedRoute />}>
            <Route element={<ProfileLayout />}>
              <Route path="profile"  element={<Profile />} />
              {/* <Route path="settings" element={<Settings />} /> */}
            </Route>
          </Route>

          {/* FALLBACK */}
          <Route path="/dashboard" element={<Navigate to="/tenant-login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;