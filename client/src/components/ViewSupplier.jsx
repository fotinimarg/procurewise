import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Rating from './Rating';

const ViewSupplier = ({ supplierId }) => {

    const [supplier, setSupplier] = useState({
        name: '',
        contact: '',
        link: '',
        logo: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await axios.get(`/suppliers/${supplierId}`);
                setSupplier(response.data);
            } catch (error) {
                console.error('Error fetching supplier:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSupplier();
    }, [supplierId]);

    const handleViewSupplier = (supplierId) => {
        window.location.href = `/suppliers/${supplierId}`;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loader animate-spin border-t-4 border-[#fc814a] rounded-full w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center items-center bg-white text-center">
            <img
                src={supplier.logo || "https://via.placeholder.com/50"}
                alt={`${supplier.name} logo`}
                className="w-2/5 mb-4"
            />
            <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium"
                >
                    {supplier.name}
                </h3>
                <div>
                    {Object.entries(supplier.contact).map(([key, value], index) => (
                        <p key={index}>
                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                        </p>
                    ))}
                </div>
                <div>
                    <Rating itemId={supplier._id} itemType='supplier' />
                </div>
                <button
                    onClick={() => handleViewSupplier(supplier.supplierId)}
                    className='bg-[#fc814a] text-white px-4 py-2 rounded-xl mt-4 hover:bg-[#fc5f18] transition-colors duration-300'>
                    View more products
                </button>
            </div>
        </div>
    );
};

export default ViewSupplier;
