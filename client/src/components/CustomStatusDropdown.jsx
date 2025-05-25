import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Custom dropdown for each order status
const CustomStatusDropdown = ({ currentStatus, onStatusChange, statusOptions, statusStyles }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef();
    const buttonRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
            buttonRef.current && !buttonRef.current.contains(e.target)) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <div className="flex flex-col justify-center items-center relative">
            <div
                ref={buttonRef}
                className="cursor-pointer py-1 rounded-xl text-white px-6 w-fit"
                style={statusStyles[currentStatus]}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
                {currentStatus}
            </div>

            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        ref={dropdownRef}
                        className="absolute left-0 top-full mt-2 bg-white shadow-md rounded-xl w-40 z-50 text-center"
                    >
                        {statusOptions.map((status) => (
                            <div
                                key={status}
                                className="px-3 py-2 cursor-pointer hover:text-[#fc814a] transition-colors duration-200 text-center"
                                onClick={() => {
                                    onStatusChange(status);
                                    setIsDropdownOpen(false);
                                }}
                            >
                                {status}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomStatusDropdown;
