const TermsOfService = () => {
    return (
        <div className="min-h-screen text-gray-700">
            <header className="bg-[#564256] text-white p-6 shadow-md">
                <div className="container mx-auto px-6">
                    <h1 className="text-xl md:text-2xl font-semibold">Terms of Service</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12 max-w-screen-xl">
                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Introduction</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Welcome to our platform. These Terms of Service govern your use of our website and services. By accessing or using our services, you agree to comply with and be bound by these terms.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">User Responsibilities</h2>
                    <p className="text-gray-600 leading-relaxed">
                        As a user of our services, you agree to use our platform responsibly and comply with all applicable laws and regulations. You are responsible for ensuring the security of your account and reporting any suspicious activity immediately.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Service Availability</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We strive to maintain the availability of our services at all times; however, we cannot guarantee uninterrupted access due to factors such as maintenance, updates, or technical failures. We will take all reasonable steps to minimize downtime.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Data Collection and Use</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Your personal data is handled in accordance with our Privacy Policy. We collect, process, and store user data only for the purpose of providing services, processing orders, and improving user experience.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Limitation of Liability</h2>
                    <p className="text-gray-600 leading-relaxed">
                        To the maximum extent permitted by law, our platform is not liable for any indirect, incidental, consequential, or punitive damages resulting from the use of our services or access to our website.
                    </p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Termination</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We reserve the right to terminate or suspend your account or access to our services at our sole discretion, without prior notice, if we believe you have violated these Terms of Service or engaged in inappropriate or harmful activities.
                    </p>
                </section>

                <section className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Changes to Terms</h2>
                    <p className="text-gray-600 leading-relaxed">
                        We reserve the right to modify or replace these Terms of Service at any time. Changes will be effective immediately upon posting to our website. Continued use of our services after changes constitutes your acceptance of the new terms.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
