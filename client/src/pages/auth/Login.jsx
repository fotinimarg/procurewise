import React from "react";
import { useState, useContext } from "react";
import UserContext from "../../../context/userContext";
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../../../context/AuthProvider";

export default function Login() {
    const navigate = useNavigate()
    const [data, setData] = useState({
        username: '',
        password: ''
    })

    const { setAuth } = useContext(AuthContext);
    const { setUser } = useContext(UserContext);

    const loginUser = async (e) => {
        e.preventDefault();

        const { username, password } = data

        try {
            const response = await axios.post('/login', {
                username,
                password
            });

            if (response.data.error) {
                toast.error(response.data.error)
            } else {
                const user = response.data.user;
                const accessToken = response.data.token;

                setData(null);
                setUser(user);
                setAuth({ user, accessToken });
                toast.success('Logged in successfully!');
                navigate('/');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Login failed. Please try again.');
            }
        }
    }
    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 mb-5">
            <div className="h-full max-w-4xl mx-auto py-5 overflow-hidden bg-white rounded-xl shadow-xl dark:bg-gray-800 text-center">
                <div className="flex flex-col items-center overflow-y-auto md:flex-row">
                    <div className="h-auto w-1/2">
                        <img src="/rb_3829.png" />
                    </div>
                    <form onSubmit={loginUser} className="justify-center w-1/2">
                        <h1 className="mb-8 text-xl font-semibold text-gray-800 dark:text-gray-200">Welcome Back!</h1>
                        <div className="flex flex-col w-full justify-center space-y-5 mt-4 items-center">
                            <label className="flex flex-col items-start gap-2 w-2/3">
                                <input
                                    type='username'
                                    placeholder="Username"
                                    value={data.username}
                                    onChange={(e) => setData({ ...data, username: e.target.value })}
                                    className="py-1 w-full border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a]" />
                            </label>

                            <label className="flex flex-col items-start gap-2 w-2/3">
                                <input
                                    type='password'
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData({ ...data, password: e.target.value })}
                                    className="py-1 w-full border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a]" />
                            </label>
                            <button
                                type='submit'
                                className="px-6 py-2 bg-[#564256] text-white rounded-full mb-3 hover:bg-[#96939b] transition-colors duration-300"
                            >
                                Sign in
                            </button>
                        </div>
                        <div className="flex relative justify-center items-end gap-3 mt-4">
                            <p>
                                <Link
                                    className="text-sm font-medium text-[#fc814a] dark:text-[#dda15e] hover:underline"
                                    to="/forgot-password">
                                    Forgot your password?
                                </Link>
                            </p>
                            <p className="mt-1">
                                <Link
                                    className="text-sm font-medium text-[#fc814a] dark:text-[#dda15e] hover:underline"
                                    to="/register">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
