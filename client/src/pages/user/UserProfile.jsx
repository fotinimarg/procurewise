import { useContext, useState } from 'react';
import UserContext from '../../../context/userContext';
import UserReviews from '../../components/UserReviews';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UserProfile() {
    const { user, loading, setLoading } = useContext(UserContext);
    const [newProfilePicture, setNewProfilePicture] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [change, setChange] = useState(false);

    // Handle file input change
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            setNewProfilePicture(file);
            setImageURL('');
        } else {
            toast.error('Please upload a valid image (JPEG/PNG).');
        }
    };

    // Handle URL input change
    const handleInputChange = (event) => {
        const url = event.target.value;
        const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg))$/i;
        if (urlRegex.test(url)) {
            setImageURL(url);
            setNewProfilePicture('');
        } else {
            toast.warn('Please provide a valid image URL.');
        }
    };

    // Save the new profile picture
    const handleSavePicture = async () => {
        setLoading(true);

        try {
            let response;
            if (newProfilePicture) {
                // Save via file upload
                const formData = new FormData();
                formData.append('profilePicture', newProfilePicture);

                response = await axios.post('/user/profile-picture', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                });

                if (response.status === 200) {
                    toast.success('Profile picture updated successfully!');
                    window.location.reload();
                    setLoading(false);
                } else {
                    toast.error('Failed to update profile picture.');
                }
            } else if (imageURL) {
                // Save via URL
                response = await axios.post('/user/profile-picture', { imageUrl: imageURL });

                if (response.status === 200) {
                    toast.success('Profile picture updated successfully!');
                    window.location.reload();
                } else {
                    toast.error('Failed to update profile picture.');
                }
            } else {
                toast.warn('Please select a file or provide an image URL.');
            }
        } catch (error) {
            console.error('Error saving profile picture:', error);
            toast.error('An error occurred while updating the profile picture.');
        } finally {
            setChange(false);
        }
    }

    // Redirect to settings page
    const handleView = () => {
        window.location.href = '/settings';
    }

    if (loading) {
        return <h1>Loading...</h1>
    }

    return (
        <div className="mx-auto p-6 max-w-screen-xl ">
            <h1 className="text-2xl font-semibold mb-4">My Profile</h1>

            <div className='container rounded-xl flex flex-col bg-white p-6 shadow-md'>

                {/* Basic Information */}
                <section className="p-6 mb-4">
                    <div className="flex items-center ml-4">
                        <div className='flex-col justify-center items-center text-center'>
                            <img src={user.profilePicture || '/default-avatar.png'} alt="Profile" className="w-28 h-28 rounded-full object-cover"
                                onError={(e) => {
                                    e.target.src = '/default-avatar.png';
                                }}
                            />
                            <p
                                className='text-sm text-[#fc814a] hover:cursor-pointer hover:underline'
                                onClick={() => setChange(true)}
                            >
                                Change
                            </p>
                        </div>
                        <div className='flex justify-between w-full mx-4'>
                            <div>
                                <p><strong>{user.fullName}</strong></p>
                                <p>{user.username}</p>
                            </div>
                            <button
                                className="text-[#fc814a] hover:underline"
                                onClick={handleView}
                            >
                                Edit
                            </button>
                        </div>
                    </div>

                    {/* Profile Picture Update */}
                    {change && (
                        <div className="mt-4">

                            {/* File Upload */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="mt-2"
                            />

                            {/* URL Input */}
                            <input
                                type="text"
                                placeholder="Or paste an image URL"
                                value={imageURL}
                                onChange={handleInputChange}
                                className="mt-2 p-2 w-full border rounded-lg"
                            />

                            <div className='flex items-center mt-3 gap-2'>
                                <button
                                    onClick={handleSavePicture}
                                    className="bg-[#fc814a] text-white px-4 py-2 rounded-lg hover:bg-[#fc5f18]"
                                    disabled={loading}>
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                                <p
                                    className='text-gray-500 hover:text-gray-700 hover:cursor-pointer'
                                    onClick={() => { setChange(false) }}>
                                    Cancel
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Personal Information */}
                <section className="p-6">
                    <div className='flex justify-between mx-4 mb-4'>
                        <h2 className='text-lg'><strong>Personal Information</strong></h2>
                        <button
                            className="text-[#fc814a] hover:underline"
                            onClick={handleView}
                        >
                            Edit
                        </button>
                    </div>
                    <div className='flex gap-20 '>
                        <div className='mx-2 mb-4'>
                            <p className='text-gray-500 my-1'>Email</p>
                            <p>{user.email}</p>
                        </div>
                        <div className='mx-2 mb-4'>
                            <p className='text-gray-500 my-1'>Business Name</p>
                            <p>{user.businessName}</p>
                        </div>
                        <div className='mx-2'>
                            <p className='text-gray-500 my-1'>Phone</p>
                            <div className='flex gap-4'>
                                {user?.phoneNumber?.length > 0 ? user?.phoneNumber.map((number) => (
                                    <div key={number._id} className='border rounded-lg p-2 px-4'>
                                        <p>{number.number}</p>
                                    </div>
                                )) :
                                    <p>
                                        No phone number available.
                                    </p>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Address */}
                <section className="p-6">
                    <div className='flex justify-between mx-4'>
                        <h2 className='text-lg'><strong>Addresses</strong></h2>
                        <button
                            className="text-[#fc814a] hover:underline"
                            onClick={handleView}
                        >
                            Edit
                        </button>
                    </div>
                    <div className='flex gap-4 mx-2'>
                        {user?.address?.length > 0 ? (
                            user.address.map((address) => (
                                <div key={address._id} className="border rounded-lg p-4 mb-2">
                                    <p>
                                        <strong>Street:</strong> {address.street}
                                    </p>
                                    <p>
                                        <strong>City:</strong> {address.city}
                                    </p>
                                    <p>
                                        <strong>Postal Code:</strong> {address.postalCode}
                                    </p>
                                </div>
                            ))) : (
                            <p className='text-gray-500'>No address available.</p>
                        )}
                    </div>
                </section>
                {/* User Reviews */}
                <section className='p-6'>
                    <UserReviews />
                </section>
            </div>
        </div>
    )
}