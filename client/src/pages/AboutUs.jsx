import React from 'react';

const AboutUsPage = () => {
    return (
        <div className="min-h-screen text-gray-700">
            <header className="bg-[#564256] text-white p-6 shadow-md">
                <div className="container mx-auto px-6">
                    <h1 className="text-xl md:text-2xl font-semibold">About Us</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12 max-w-screen-xl">
                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Our Mission</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We are committed to revolutionizing the way small businesses connect with suppliers. Our platform allows users to compare prices, find the best suppliers, and streamline their procurement processes efficiently and transparently.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Our Vision</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Our vision is to become the leading platform that empowers small businesses with easy access to competitive suppliers. We believe in simplifying the supply chain process with cutting-edge tools and a user-first approach.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Why Choose Us?</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
                        <li>🛠️ **User-Friendly Interface**: Designed with simplicity and usability in mind.</li>
                        <li>💡 **Real-Time Comparisons**: Compare suppliers’ prices and terms instantly.</li>
                        <li>🔒 **Secure & Reliable**: Your data and transactions are always secure with us.</li>
                        <li>🤝 **Partner with Trusted Suppliers**: Connect with verified and reputable suppliers.</li>
                    </ul>
                </section>
            </div>
        </div >
    );
};

export default AboutUsPage;