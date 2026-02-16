import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleUnauthorized = () => {
            if (!isAuthenticated && !loading) {
                navigate('/tenant-login', { replace: true });
            }
        };

        handleUnauthorized();
    }, [isAuthenticated, loading, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/tenant-login" replace />;
};

export default ProtectedRoute;
