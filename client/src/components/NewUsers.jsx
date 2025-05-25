import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NewUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchNewUsers = async () => {
            try {
                const response = await axios.get("/user/admin/new-users");
                setUsers(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };

        fetchNewUsers();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-3">New Users</h3>
            <table className="min-w-full table-auto">
                <thead className="bg-[#e8e8e8]">
                    <tr>
                        <th className="px-2 py-2 text-left">Name</th>
                        <th className="px-2 py-2 text-left">Username</th>
                        <th className="px-2 py-2 text-left">Email</th>
                        <th className="px-2 py-2 text-left">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {users && users.length > 0 ? (users.map(user => (
                        <tr key={user._id} className="border-t">
                            <td className="px-2 py-2 text-left">{user.firstName} {user.lastName}</td>
                            <td className="px-2 py-2 text-left">{user.username}</td>
                            <td className="px-2 py-2 text-left">{user.email}</td>
                            <td className="px-2 py-2 text-sm text-left">
                                <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                                <div className="text-gray-600">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                        </tr>
                    ))) : (
                        <tr>
                            <td className="px-2 py-2 text-center text-gray-500">
                                No new users in the past 7 days.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex justify-end">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-300 mt-3"
                >
                    All Users →
                </button>
            </div>
        </div>
    );
};

export default NewUsers;