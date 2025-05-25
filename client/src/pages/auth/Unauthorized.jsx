import { useNavigate } from "react-router-dom"

export default function Unauthorized() {
    const navigate = useNavigate();
    const goBack = () => navigate(-2);

    return (
        <section className="mt-20 items-center">
            <h1 className="text-3xl text-gray-700">Unauthorized</h1>
            <p>You do not have access to the requested page.</p>
            <div className="flex-grow">
                <button onClick={goBack}
                    className="rounded-md text-center align-middle 
                items-center px-4 text-[#564256] hover:underline">
                    Go Back
                </button>
            </div>
        </section>
    )
}
