const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen text-gray-700">
            <header className="bg-[#564256] text-white p-6 shadow-md">
                <div className="container mx-auto px-6">
                    <h1 className="text-xl md:text-2xl font-semibold">Privacy Policy</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12 max-w-screen-xl">
                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Introduction</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform. Please read this policy carefully to understand our practices regarding your personal information.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Information We Collect</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We may collect personal information such as your name, email address, contact details, and payment information when you sign up for our services, place an order, or otherwise interact with our platform. We use this information to provide and improve our services.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">How We Use Your Information</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We use your information to process orders, send you notifications, improve user experience, and provide personalized services. Your data is only shared with trusted partners when necessary and will never be sold to third parties.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Sharing Information</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We do not sell, trade, or share your personal information with third parties. We may share information with trusted partners only to process transactions, provide technical assistance, or comply with legal obligations.
                    </p>
                </section>

                <section className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Your Rights</h2>
                    <p className="text-gray-600 leading-relaxed">
                        You have the right to access, correct, or delete your personal data at any time. If you have any concerns or questions about how we handle your information, please contact our support team.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
