import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("Verifying...");
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setMessage("Invalid verification link.");
                return;
            }

            try {
                const response = await axios.post(`/verify-email?token=${token}`);

                if (response.data) {
                    setMessage("Email verified successfully! Redirecting...");
                    setTimeout(() => navigate("/login"), 3000);
                } else {
                    setMessage("Verification failed. The link may be expired.");
                }
            } catch (error) {
                setMessage("An error occurred during verification.");
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="flex justify-center items-center mt-40">
            <div className="p-6 bg-white shadow-md rounded-xl">
                <h2 className="text-lg font-bold">{message}</h2>
            </div>
        </div>
    );
};

export default VerifyEmail;