import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopSellingCarousel from "../components/TopSellingCarousel";
import SupplierCarousel from "../components/SupplierCarousel";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div>
            <header className="bg-gradient-to-b from-[#f3f4f6] to-[#BFBFBF] text-[#564256] py-16 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-extrabold mb-4">
                        Simplify Your Shopping, Elevate Your Business
                    </h1>
                    <p className="text-lg mb-6">
                        Discover the smart way to source products. Compare suppliers, find
                        the best prices, and streamline your purchases—all in one place.
                    </p>
                    <button
                        className="bg-[#FC814A] text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-[#E8E8E8] hover:text-[#FC814A] transition-colors duration-300"
                        onClick={() => navigate('/register')}
                    >
                        Start Saving Now
                    </button>
                    <p className="text-sm mt-4">
                        Trusted by <span className="font-bold">1,000+</span> small businesses.
                    </p>
                </div>
            </header>

            <div className='p-6 px-20 max-w-screen-2xl mx-auto'>
                <TopSellingCarousel limit={5} title={'Best Sellers'} />
                <div className="mt-3">
                    <SupplierCarousel />
                </div>
            </div>
        </div>

    )
}