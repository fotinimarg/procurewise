import React from 'react'

export default function Help() {
    return (
        <div className="min-h-screen text-gray-700">
            <header className="bg-[#564256] text-white p-6 shadow-md">
                <div className="container mx-auto px-6">
                    <h1 className="text-xl md:text-2xl font-semibold">Help & Support</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12 max-w-screen-xl">
                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Getting Started</h2>
                    <ul className="list-disc pl-5">
                        <li><strong>Sign Up / Log In</strong> – Create an account or log in to access your dashboard.</li>
                        <li><strong>Browse Products</strong> – Search and compare products from multiple suppliers.</li>
                        <li><strong>Add to Cart</strong> – Add items to your cart, even if you're not logged in.</li>
                        <li><strong>Place an Order</strong> – Complete your purchase securely.</li>
                    </ul>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Frequently Asked Questions</h2>
                    <h3 className="text-lg font-medium mt-4">How do I reset my password?</h3>
                    <p>If you've forgotten your password, click on the "Forgot Password" link on the login page and follow the instructions.</p>

                    <h3 className="text-lg font-medium mt-4">Can I place an order without an account?</h3>
                    <p>No. You can add items to your cart as a guest. However, creating an account is essential for placing an order.</p>

                    <h3 className="text-lg font-medium mt-4">How does pricing work for different suppliers?</h3>
                    <p>Each product may have multiple suppliers offering different prices. We list the lowest price first, but you can compare all options before purchasing.</p>

                    <h3 className="text-lg font-medium mt-4">How do I update my address?</h3>
                    <p>Go to <strong>Settings &gt; Address</strong>, where you can add, edit, or remove your saved addresses.</p>

                    <h3 className="text-lg font-medium mt-4">What payment methods do you accept?</h3>
                    <p>We accept major credit/debit cards and online payment methods. More options may be available based on your location.</p>
                </section>

                <section className="mb-10 bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-[#564256]">Need More Help?</h2>
                    <p>If you have any other questions, feel free to contact us:</p>
                    <ul className="list-disc pl-5">
                        <li><strong>Email:</strong> support@procurewise.com</li>
                        <li><strong>Phone:</strong> +123 456 7890</li>
                    </ul>

                    <p className="mt-6">Thank you for using ProcureWise!</p>
                </section>
            </div>
        </div>
    )
}
