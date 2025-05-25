import { Link, useNavigate } from "react-router-dom"
import { CiSearch } from "react-icons/ci";
import { TbLogout, TbSettings, TbUser } from "react-icons/tb";
import { BiUser } from "react-icons/bi";
import { PiUserCircleLight, PiShoppingCartSimpleLight } from "react-icons/pi";
import { useState, useContext, useRef, useEffect } from "react";
import UserContext from '../../context/userContext';
import AuthContext from "../../context/AuthProvider";
import axios from "axios";
import { toast } from 'react-hot-toast';
import CartPopup from "./CartPopup";
import CartContext from "../../context/CartContext";
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
    { name: "Profile", href: "/profile" },
    { name: "Settings", href: "/settings" },
    { name: "Logout", href: "#" }
]

export default function Navbar() {
    const { setUser } = useContext(UserContext);
    const { auth, setAuth } = useContext(AuthContext);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const buttonRef2 = useRef(null);

    const cartRef = useRef(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { cart } = useContext(CartContext);

    // Close dropdown when clicking anywhere outside
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            buttonRef.current && !buttonRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
        else if (cartRef.current && !cartRef.current.contains(event.target) &&
            buttonRef2.current && !buttonRef2.current.contains(event.target)) {
            setIsCartOpen(false);
        }
    }

    useEffect(() => {
        const handleDocumentClick = (event) => handleClickOutside(event);

        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    // Handle search
    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    }

    const totalItems = cart?.groupedProducts?.reduce(
        (acc, group) => acc + group.products.reduce((sum, product) => sum + product.quantity, 0),
        0
    )

    // Logout function
    const logoutUser = async () => {
        try {
            await axios.post('/logout');
            toast.success('Logged out successfully');
            setAuth(null);
            setUser(null);
            navigate('/login');
        } catch (error) {
            console.log('Logout failed', error);
            toast.error('Logout failed');
        }
    }

    return (
        <nav className="flex justify-between items-center bg-gray-100 
        px-8 py-4">
            {/* Left Side */}
            {auth?.accessToken ? "" : <Link to="/">ProcureWise</Link>}

            {/* Search Bar */}
            <div className="flex justify-between items-center relative sm:w-96 space-x-1">
                <CiSearch onClick={handleSearch} className="size-5 absolute inline-block left-4 cursor-pointer" color="#344e41" />
                <input
                    type="text"
                    name="search"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-gray-50 text-gray-950 
                w-full py-1 md:px-10 px-10 rounded-full shadow-md shadow-gray-200 focus:outline-none"
                />
            </div>

            {/* Right side */}
            <div className="relative flex items-center md:space-x-3 gap-3">
                {
                    auth ? <>
                        <button
                            ref={buttonRef}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <PiUserCircleLight className="size-6" color="rgb(3 7 18)" />
                        </button>
                        <AnimatePresence>
                            {
                                isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        ref={dropdownRef}
                                        className="fixed top-16 right-5 bg-white shadow-lg rounded-lg w-44 z-50 text-center"
                                    >
                                        <ul className="flex flex-col items-center py-2" >
                                            {
                                                navigation.map((item) => (
                                                    <li key={item.name} onClick={() => setIsDropdownOpen(false)}>
                                                        {item.name === 'Logout' ?
                                                            (
                                                                <button onClick={logoutUser} className="flex items-center gap-1 rounded-full 
                                                        py-2 text-sm hover:text-[#fc814a]  transition-colors duration-200">
                                                                    <TbLogout />
                                                                    {item.name}
                                                                </button>
                                                            ) :
                                                            (<Link to={item.href} className="flex items-center gap-1 rounded-full 
                                                        py-2 text-sm hover:text-[#fc814a]  transition-colors duration-200">
                                                                {item.name === 'Settings' ? <TbSettings /> : <BiUser />}
                                                                {item.name}
                                                            </Link>
                                                            )}
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>

                        {/* Cart Button */}
                        <button
                            ref={buttonRef2}
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            className="relative text-gray-800 hover:text-[#fc814a]"
                        >
                            <PiShoppingCartSimpleLight fontWeight='light' className="size-6" color="rgb(3 7 18)"
                            />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </> : <>
                        <Link to='/register' className="hover:text-[#fc814a] transition-colors duration-300">Register</Link>
                        <p>/</p>
                        <Link to='/login' className="hover:text-[#fc814a] transition-colors duration-300">Login</Link>

                        {/* Cart Button */}
                        <button
                            ref={buttonRef2}
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            className="relative text-gray-800 hover:text-[#fc814a]"
                        >
                            <PiShoppingCartSimpleLight fontWeight='light' className="size-6" color="rgb(3 7 18)"
                            />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </>
                }

            </div>

            <AnimatePresence>
                {isCartOpen && (
                    <CartPopup ref={cartRef} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                )}
            </AnimatePresence>
        </nav >
    )
}
