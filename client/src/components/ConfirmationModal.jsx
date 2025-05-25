import { useEffect } from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center text-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold">{title || "Are you sure?"}</h2>
                <p className="text-gray-600 mt-2">{message}</p>
                <div className="mt-4 flex justify-center space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-xl transition-colors duration-300">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-800 transition-colors duration-300 text-white rounded-xl">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;