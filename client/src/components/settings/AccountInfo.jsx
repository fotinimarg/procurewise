import React, { useState, useEffect, useContext } from 'react';
import UserContext from '../../../context/userContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const AccountInfo = () => {
    const { user, setUser } = useContext(UserContext);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        businessName: ''
    });
    const [editMode, setEditMode] = useState({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        businessName: false
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
                businessName: user.businessName || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleEditToggle = (field) => {
        setEditMode({
            ...editMode,
            [field]: !editMode[field]
        });
    };

    const handleSave = async (field) => {
        try {
            const payload = { [field]: formData[field] };

            console.log(payload)

            const response = await axios.put('/user/update', payload);

            setUser((prevUser) => ({
                ...prevUser,
                [field]: formData[field]
            }));

            console.log(`${field} updated successfully:`, response.data);
            toast.success(`${field} updated successfully!`);
            setEditMode({ ...editMode, [field]: false });
        } catch (error) {
            console.error(`Error updating ${field}:`, error);

            if (error.response && error.response.status === 400) {
                toast.error('This username is already in use. Please choose another one.')
            } else {
                toast.error(`Failed to update ${field}. Please try again.`);
            }
        }
    };

    return (
        <div className="p-4 max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>

            {/* Name Section */}
            <div className="flex gap-6 items-center mb-8 w-full">
                <div className='w-1/2'>
                    <label className="block mb-1 text-gray-500">First Name</label>
                    {editMode.firstName ? (
                        <div className="flex items-center justify-between">
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-3/4 border border-gray-400 rounded-xl p-3"
                            />
                            <button
                                onClick={() => handleSave('firstName')}
                                className="px-3 py-1 ml-1 text-white bg-[#fc814a] rounded hover:bg-[#fc5f18] transition-colors duration-300"
                            >
                                Save
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className='border w-3/4 rounded-xl p-3 border-gray-300'>{formData.firstName}</span>
                            <button
                                onClick={() => handleEditToggle('firstName')}
                                className="text-[#fc814a]  hover:underline"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>

                <div className='w-1/2'>
                    <label className="block mb-1 text-gray-500">Last Name</label>
                    {editMode.lastName ? (
                        <div className="flex items-center justify-between">
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-3/4 border border-gray-400 rounded-xl p-3"
                            />
                            <button
                                onClick={() => handleSave('lastName')}
                                className="px-3 py-1 ml-1 text-white bg-[#fc814a] rounded hover:bg-[#fc5f18] transition-colors duration-300"
                            >
                                Save
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className='border w-3/4 rounded-xl p-3 border-gray-300'>{formData.lastName}</span>
                            <button
                                onClick={() => handleEditToggle('lastName')}
                                className="text-[#fc814a]  hover:underline"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Username Section */}
            <div className="mb-8">
                <label className="block mb-1 text-gray-500">Username</label>
                {editMode.username ? (
                    <div className="flex items-center justify-between">
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-3/4 border border-gray-400 rounded-xl p-3"
                        />
                        <button
                            onClick={() => handleSave('username')}
                            className="px-3 py-1 text-white bg-[#fc814a] rounded hover:bg-[#fc5f18] transition-colors duration-300"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <span className='border w-3/4 rounded-xl p-3 border-gray-300'>{formData.username}</span>
                        <button
                            onClick={() => handleEditToggle('username')}
                            className="text-[#fc814a]  hover:underline"
                        >
                            Edit
                        </button>
                    </div>
                )}
            </div>

            {/* Email Section */}
            <div className="mb-8">
                <label className="block text-gray-500 mb-1">Email</label>
                {editMode.email ? (
                    <div className="flex items-center justify-between">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-3/4 border border-gray-400 rounded-xl p-3"
                        />
                        <button
                            onClick={() => handleSave('email')}
                            className="ml-2 px-3 py-1 text-white bg-[#fc814a] rounded-md hover:bg-[#fc5f18] transition-colors duration-300"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <span className='border w-3/4 rounded-xl p-3 border-gray-300'>{formData.email}</span>
                        <button
                            onClick={() => handleEditToggle('email')}
                            className="text-[#fc814a] hover:underline"
                        >
                            Edit
                        </button>
                    </div>
                )}
            </div>

            {/* Business Name Section */}
            <div className="mb-8">
                <label className="block mb-1 text-gray-500">Business Name</label>
                {editMode.businessName ? (
                    <div className="flex items-center justify-between">
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="w-3/4 border border-gray-400 rounded-xl p-3"
                        />
                        <button
                            onClick={() => handleSave('businessName')}
                            className="ml-2 px-3 py-1 text-white bg-[#fc814a] rounded hover:bg-[#fc5f18] transition-colors duration-300"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <span className='border w-3/4 rounded-xl p-3 border-gray-300'>{formData.businessName}</span>
                        <button
                            onClick={() => handleEditToggle('businessName')}
                            className="text-[#fc814a] hover:underline"
                        >
                            Edit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountInfo;
