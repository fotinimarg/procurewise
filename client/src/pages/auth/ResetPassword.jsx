import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            const response = await axios.post("/reset-password", { token, newPassword });
            setMessage(response.data.message);
            setTimeout(() => navigate("/login"), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || "Something went wrong.");
        }
    };

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900">
            <div className="h-80 max-w-4xl mx-auto py-5 overflow-hidden bg-white rounded-xl shadow-xl dark:bg-gray-800 text-center mb-20 flex flex-col items-center justify-center">
                <h2 className="my-6 text-xl font-semibold text-gray-800 dark:text-gray-200">Reset Password</h2>
                <p className="text-lg mb-3">Enter your new password below.</p>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3"
                >
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="p-1 border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a]"
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        className="p-1 border-b border-gray-300 focus:outline-none focus:border-b focus:ring-[#fc814a]"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-[#564256] text-white rounded-full my-3 hover:bg-[#96939b] transition-colors duration-300"
                    >
                        Reset Password
                    </button>
                </form>
                {message && <p className="text-[#fc814a]">{message}</p>}
            </div>
        </div>
    );
}

export default ResetPassword;