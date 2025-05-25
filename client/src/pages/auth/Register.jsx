import React from "react";
import { useState } from "react";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate()
    const [data, setData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: ''
    })

    const [isChecked, setIsChecked] = useState(false);

    const handleCheckbox = (e) => {
        setIsChecked(e.target.checked);
    }

    const registerUser = async (e) => {
        e.preventDefault()

        if (!isChecked) {
            toast.error('Please agree to the privacy policy to continue.');
            return;
        }

        const { firstName, lastName, username, email, password } = data
        try {
            const { data } = await axios.post('/register', {
                firstName, lastName, username, email, password
            })

            if (!data.error) {
                setData({})
                toast.success("You're all set! Just confirm your email to complete your registration.")
                navigate('/login')
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Registration failed. Please try again.');
            }
        }
    }

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900 mb-5">
            <div className="h-full max-w-4xl mx-auto py-5 overflow-hidden bg-white rounded-xl shadow-xl text-center dark:bg-gray-800">
                <div className="flex flex-col items-center overflow-y-auto md:flex-row">
                    <div className="h-auto w-1/2"><img src="/rb_3948.png" /></div>
                    <form onSubmit={registerUser} className="justify-center w-1/2 py-10">
                        <h1 className="mb-8 text-xl font-semibold text-gray-800 dark:text-gray-200">Create an account</h1>
                        <div className="flex flex-col w-full justify-center space-y-4 mt-4 items-center">
                            <label className="flex flex-col items-start gap-2 w-2/3">
                                <input
                                    type='text'
                                    placeholder="First Name"
                                    value={data.firstName}
                                    onChange={(e) => setData({ ...data, firstName: e.target.value })}
                                    className="py-1 w-full border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a]" />
                            </label>
                            <label className="flex flex-col items-start gap-2 w-2/3">
                                <input
                                    type='text'
                                    placeholder="Last Name"
                                    value={data.lastName}
                                    onChange={(e) => setData({ ...data, lastName: e.target.value })}
                                    className="py-1 w-full border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a]" />
                            </label>
                            <label className="flex flex-col items-start gap-2 w-2/3">
                                <input
                                    type='text'
                                    placeholder="Username"
                                    value={data.username}
                                    onChange={(e) => setData({ ...data, username: e.target.value })}
                                    className="py-1 w-full border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a]" />
                            </label>

                            <label className="flex flex-col items-start gap-2 w-2/3">
                                <input
                                    type='email'
                                    placeholder="Email Address"
                                    value={data.email}
                                    onChange={(e) => setData({ ...data, email: e.target.value })}
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

                            <label className="mt-4 flex text-sm text-gray-600" check="true">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={handleCheckbox}
                                />
                                <span className="ml-2 flex gap-1 text-xs">
                                    I agree to the
                                    <a
                                        href="/terms-of-service"
                                        className="text-[#fc814a] hover:underline hover:cursor-pointer">
                                        terms of service
                                    </a>
                                    and
                                    <a
                                        href="/privacy-policy"
                                        className="text-[#fc814a] hover:underline hover:cursor-pointer">
                                        privacy policy
                                    </a>
                                </span>
                            </label>

                            <button type='submit'
                                className={`px-6 py-2 bg-[#564256] text-white rounded-3xl mb-3 mt-6 ${isChecked ? 'hover:bg-[#96939b] transition-colors duration-300' : 'cursor-default'}`}>Sign up
                            </button>

                            <p className="mt-3">
                                <Link
                                    className="text-sm font-medium text-[#fc814a] dark:text-[#dda15e] hover:underline"
                                    to="/login">
                                    Already have an account? Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}