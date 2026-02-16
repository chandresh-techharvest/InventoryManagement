import { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const { data } = await api.get('/tenant/me');
            setUser(data.user);
            setTenant(data.tenant);
        } catch (error) {
            // User not authenticated
        } finally {
            setLoading(false);
        }
    };

    const register = async (businessName, fullName, email, password) => {
        const { data } = await api.post('/tenant/registration', {
            businessName,
            fullName,
            email,
            password
        });

        setUser(data.user);
        setTenant(data.tenant);
        return data;
    };

    const login = async (email, password) => {
        const { data } = await api.post('/tenant/login', { email, password });
        setUser(data.user);
        setTenant(data.tenant);
        return data;
    };

    const logout = async () => {
        try {
            await api.post('/tenant/logout');
        } catch (error) {
            // Ignore errors
        }
        setUser(null);
        setTenant(null);
    };

    const value = {
        user,
        tenant,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
