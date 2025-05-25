import React, { useState, useRef, useEffect } from 'react';
import SecuritySettings from '../../components/settings/SecuritySettings';
import PhoneNumber from '../../components/settings/PhoneNumber';
import AddressChange from '../../components/settings/AddressChange';
import AccountInfo from '../../components/settings/AccountInfo'

const Settings = () => {
    const [selectedSection, setSelectedSection] = useState('accountInfo');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const navRef = useRef(null);

    const handleSectionClick = (section, event) => {
        setSelectedSection(section);
        const button = event.target;
        setIndicatorStyle({
            width: button.offsetWidth,
            left: button.offsetLeft,
        });
    };

    useEffect(() => {
        // Set the initial position of the indicator
        const activeButton = navRef.current.querySelector('.active');
        if (activeButton) {
            setIndicatorStyle({
                width: activeButton.offsetWidth,
                left: activeButton.offsetLeft,
            });
        }
    }, []);

    const renderSection = () => {
        switch (selectedSection) {
            case 'accountInfo':
                return <AccountInfo />;
            case 'address':
                return <AddressChange />;
            case 'phoneNumber':
                return <PhoneNumber />;
            case 'security':
                return <SecuritySettings />;
            default:
                return <AccountInfo />;
        }
    };

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <h1 className="text-2xl font-semibold mb-4">Settings</h1>
            <div className="container rounded-xl flex flex-col bg-white p-6 shadow-md">

                {/* Navbar */}
                <nav ref={navRef} className="relative flex w-full justify-evenly pr-4 border-b">
                    <button onClick={(e) => handleSectionClick('accountInfo', e)} className={`p-2 ${selectedSection === 'accountInfo' ? 'font-bold active' : ''}`}>
                        Account
                    </button>
                    <button onClick={(e) => handleSectionClick('address', e)} className={`p-2 ${selectedSection === 'address' ? 'font-bold active' : ''}`}>
                        Address
                    </button>
                    <button onClick={(e) => handleSectionClick('phoneNumber', e)} className={`p-2 ${selectedSection === 'phoneNumber' ? 'font-bold active' : ''}`}>
                        Phone Number
                    </button>
                    <button onClick={(e) => handleSectionClick('security', e)} className={`p-2 ${selectedSection === 'security' ? 'font-bold active' : ''}`}>
                        Security
                    </button>

                    {/* Sliding Indicator */}
                    <div
                        className="absolute bottom-0 h-[2px] bg-gray-950 transition-all duration-300"
                        style={indicatorStyle}
                    ></div>
                </nav>

                {/* Content Section */}
                <div className="mt-4 pl-4">
                    {renderSection()}
                </div>
            </div>
        </div>
    );
};

export default Settings;