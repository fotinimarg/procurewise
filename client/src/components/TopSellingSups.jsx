import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TopSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopSuppliers = async (limit = 6) => {
            try {
                const response = await axios.get("/suppliers/admin/top", {
                    params: { limit }
                });
                setSuppliers(response.data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTopSuppliers(8);
    }, []);

    if (loading) return <p>Loading top suppliers...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Top Suppliers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {suppliers.map((supplier) => (
                    <div key={supplier._id} className="p-4 rounded-xl shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
                        <Link to={`/suppliers/${supplier.supplierId}`}>
                            <h3 className="text-lg font-bold hover:text-[#fc814a] transition-colors duration-200">{supplier.name}</h3>
                        </Link>
                        <p>Email: {supplier.email}</p>
                        <p>Phone: {supplier.phone}</p>
                        <p className="text-green-600 font-bold">Total Sales: {supplier.totalSales}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopSuppliers;