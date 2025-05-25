import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthContext from './AuthProvider';

const AdminProtected = ({ children }) => {
    const { auth, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    if (!auth || (auth.user.role !== 'admin')) {
        toast.error('Access denied: Admins only.');
        return <Navigate to="/" />;
    }

    return children;
};

export default AdminProtected;
