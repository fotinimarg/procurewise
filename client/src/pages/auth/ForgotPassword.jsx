import { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const response = await axios.post("/forgot-password", { email });
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response?.data?.message || "Something went wrong.");
        }
    };

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-900">
            <div className="h-60 max-w-4xl mx-auto py-5 overflow-hidden bg-white rounded-xl shadow-xl dark:bg-gray-800 text-center mb-20">
                <h2 className="my-6 text-xl font-semibold text-gray-800 dark:text-gray-200">Forgot Password?</h2>
                <p className="text-lg mb-3">Enter your email to receive a password reset link.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="p-1 border-b border-gray-300 focus:outline-none focus:border-b focus:border-[#fc814a] mr-2"
                    />
                    <button
                        className="px-6 py-2 bg-[#564256] text-white rounded-full mb-3 hover:bg-[#96939b] transition-colors duration-300"
                        type="submit">
                        Send Reset Link
                    </button>
                </form>
                {message && <p className="text-[#fc814a]">{message}!</p>}
            </div>
        </div>
    );
}

export default ForgotPassword;