// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check authentication
        try {
            const token = sessionStorage.getItem('token');
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Error checking authentication:', error);
            setIsAuthenticated(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Show loading state while checking
    if (isChecking) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles?.length) {
        const user = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (!allowedRoles.includes(user?.role)) {
            return <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'club' ? '/club' : '/dashboard'} replace />;
        }
    }

    // Render the protected component if authenticated
    return <>{children}</>;
};

export default ProtectedRoute;