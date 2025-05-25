import React from 'react'
import { useNavigate } from 'react-router-dom';

export default function Page404() {
    const navigate = useNavigate();
    const goBack = () => navigate(-1);

    return (
        <div className="flex flex-col items-center pt-40">
            <h1 className="text-6xl font-semibold text-gray-700 dark:text-gray-200">404</h1>
            <p className="text-gray-700 dark:text-gray-300">
                Page not found. Check the address or{' '}
                <a className="text-[#bc6c25] hover:underline hover:cursor-pointer dark:text-[#dda15e]" onClick={goBack}>
                    go back
                </a>
                .
            </p>
        </div>
    )
}