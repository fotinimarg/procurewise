import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from './AuthProvider';

const AdminRoute = ({ children }) => {
    const { auth } = useContext(AuthContext);

    if (auth) {
        if (!auth.user.isAdmin) {
            return <Navigate to="/unauthorized" />;
        } else {
            return children;
        }
    }
    return <Navigate to="/login" />
};

export default AdminRoute;