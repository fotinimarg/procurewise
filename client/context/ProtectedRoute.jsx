import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from './AuthProvider';

const ProtectedRoute = ({ children }) => {
    const { auth, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!auth?.user) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
