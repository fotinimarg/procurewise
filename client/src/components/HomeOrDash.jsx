import React, { useContext } from 'react'
import AuthContext from '../../context/AuthProvider'
import Home from '../pages/Home';
import Dashboard from '../pages/user/Dashboard';
import Dash from '../pages/admin/Dash';

export default function HomeOrDash() {
    const { auth } = useContext(AuthContext);

    if (auth?.accessToken) {
        if (auth?.user.role === 'admin') {
            // If user is admin navigate to Admin's Dashboard
            return <Dash />
        }
        // If simple user navigate to User's Dashboard
        return <Dashboard />
    } else {
        // If no user navigate to Home page
        return <Home />
    }
}
