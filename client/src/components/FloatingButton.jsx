import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BetweenHorizontalStart } from 'lucide-react';

// Floating button for categories
const FloatingButton = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/categories');
    }

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-12 right-12 bg-[#fc814a] text-white rounded-full p-3 shadow-lg hover:bg-[#ff9e6b] transition duration-300 flex gap-2 items-center"
            style={{ zIndex: 1000 }}
        >
            <BetweenHorizontalStart size={20} />
            Categories
        </button>
    );
};

export default FloatingButton;
