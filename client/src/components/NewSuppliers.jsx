import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NewSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchNewSuppliers = async () => {
            try {
                const response = await axios.get("/suppliers/admin/new-suppliers");
                setSuppliers(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };

        fetchNewSuppliers();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-3">New Suppliers</h3>
            <table className="min-w-full table-auto">
                <thead className="bg-[#e8e8e8]">
                    <tr>
                        <th className="px-2 py-2 text-left">Name</th>
                        <th className="px-2 py-2 text-left">Email</th>
                        <th className="px-2 py-2 text-left">VAT</th>
                        <th className="px-2 py-2 text-left">Added</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers && suppliers.length > 0 ? (suppliers.map(supplier => (
                        <tr key={supplier._id} className="border-t">
                            <td className="px-2 py-2 text-left text-wrap max-w-[160px]">{supplier.name}</td>
                            <td className="px-2 py-2 text-left text-wrap break-words max-w-[160px]">{supplier.contact.email}</td>
                            <td className="px-2 py-2 text-left">{supplier.vatNumber}</td>
                            <td className="px-2 py-2 text-sm text-left">
                                <div>{new Date(supplier.createdAt).toLocaleDateString()}</div>
                                <div className="text-gray-600">{new Date(supplier.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                        </tr>
                    ))) : (
                        <tr>
                            <td className="px-2 py-2 text-center text-gray-500">
                                No new suppliers in the past 7 days.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex justify-end">
                <button
                    onClick={() => navigate('/admin/suppliers')}
                    className="text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-300 mt-3"
                >
                    All Suppliers →
                </button>
            </div>
        </div>
    );
};

export default NewSuppliers;