const ContactInfo = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-700">
            <header className="bg-[#564256] text-white p-6 shadow-md">
                <div className="container mx-auto px-6">
                    <h1 className="text-xl md:text-2xl font-semibold">Contact Information</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12 max-w-screen-xl">
                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Our Contact Information</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We are always here to help. If you have any questions, feedback, or require assistance, feel free to contact us through the methods below.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Reach Out to Us</h2>
                    <ul className="text-gray-600 leading-relaxed space-y-2">
                        <li>📧 <strong>Email:</strong> support@yourcompany.com</li>
                        <li>📞 <strong>Phone:</strong> +1 (555) 123-4567</li>
                        <li>🌐 <strong>Website:</strong> <a href="https://yourcompany.com" className="text-[#FC814A] hover:underline">yourcompany.com</a></li>
                        <li>💬 <strong>Social Media:</strong></li>
                        <div className="flex space-x-4 mt-2">
                            <a href="https://twitter.com" className="text-[#FC814A] hover:underline">Twitter</a>
                            <a href="https://facebook.com" className="text-[#FC814A] hover:underline">Facebook</a>
                            <a href="https://linkedin.com" className="text-[#FC814A] hover:underline">LinkedIn</a>
                        </div>
                    </ul>
                </section>

                <section className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Our Office</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Visit our main office at the address below:
                    </p>
                    <p className="text-gray-600 leading-relaxed mt-2">
                        📍 123 Business Street, Suite 456, Business City, Greece
                    </p>
                </section>
            </div>
        </div>
    );
};

export default ContactInfo;  