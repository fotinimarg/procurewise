import React from "react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-[#f3f4f6] to-[#BFBFBF] text-[#564256] p-2 pt-10">
            <div className="xl:max-w-screen-xl lg:max-w-screen-lg md:max-w-screen-md sm:max-w-screen-sm sm:mx-8 mx-auto">
                {/* Useful Links */}
                <div className="flex justify-between items-center border-b border-[#96939B] pb-2 mb-2">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="/about"
                                    className="hover:text-[#FC814A] transition-colors duration-200"
                                >
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/contact"
                                    className="hover:text-[#FC814A] transition-colors duration-200"
                                >
                                    Contact
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/privacy-policy"
                                    className="hover:text-[#FC814A] transition-colors duration-200"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Social Icons */}
                    <div>
                        <h3 className="font-bold text-lg mb-2">Follow Us</h3>
                        <div className="flex space-x-4">
                            <a
                                href="#facebook"
                                className="hover:text-[#FC814A] transition-colors duration-200"
                            >
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a
                                href="#twitter"
                                className="hover:text-[#FC814A] transition-colors duration-200"
                            >
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a
                                href="#instagram"
                                className="hover:text-[#FC814A] transition-colors duration-200"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Credits */}
                <div className="text-center text-sm">
                    <p>
                        © {currentYear} ProcureWise. All rights reserved.
                        <a
                            className="font-bold hover:text-[#FC814A] transition-colors duration-200"
                        >

                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
