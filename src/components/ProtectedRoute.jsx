import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // wait for auth check
  if (loading) {
    return <div>Loading...</div>;
  }

  // not logged in
  if (!isAuthenticated) {
    return <Navigate to="/tenant-login" replace />;
  }

  // ✅ IMPORTANT: render nested routes
  return <Outlet />;
};

export default ProtectedRoute;