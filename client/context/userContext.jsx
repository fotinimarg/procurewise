import axios from 'axios';
import { createContext, useState, useEffect } from 'react';

const UserContext = createContext({})

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        // Load initial state of sidebar from localStorage
        const savedState = localStorage.getItem('sidebarState');
        return savedState === null ? true : JSON.parse(savedState);
    });

    const toggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarState', JSON.stringify(newState));
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await axios.get('/user/profile')

                if (data) {
                    setUser(data);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.log('User fetch error:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [user?.id]);

    return (
        <UserContext.Provider value={{ user, setUser, loading, setLoading, sidebarOpen, toggleSidebar }}>
            {children}
        </UserContext.Provider>
    )
}

export default UserContext;