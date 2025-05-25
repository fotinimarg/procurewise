import axios from "axios";
import { createContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await axios.get('/auth/me');
                const user = data.user
                const accessToken = data.accessToken

                setAuth({ user, accessToken })
            } catch (err) {
                setAuth(null);
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, [])

    return (
        <AuthContext.Provider value={{ auth, setAuth, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;