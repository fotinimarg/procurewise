import React, { useState, useEffect } from 'react';
import SupplierCard from '../components/SupplierCard';
import axios from 'axios';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get('/suppliers');
                setSuppliers(response.data.suppliers);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSuppliers();
    }, []);

    if (loading) {
        return <p>Loading suppliers...</p>;
    }

    return (
        <div className="mx-auto p-6 max-w-screen-xl ">
            <h1 className="text-2xl font-semibold mb-4">All Suppliers</h1>
            <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-center">
                {suppliers.map((supplier) => (
                    <SupplierCard key={supplier._id} supplier={supplier} />
                ))}
            </div>
        </div>
    )
}

export default SuppliersPage;