import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../../context/AuthProvider';
import UserContext from '../../../context/userContext';

const SecuritySettings = () => {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { user, setUser } = useContext(UserContext);
    const { auth, setAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    // Handle password change
    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            await axios.post('/user/password', {
                currentPassword,
                newPassword,
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowPasswordForm(false);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to update password');
            }
            console.log('Error changing password:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Handle logout from all devices
    const handleLogoutAllDevices = async () => {
        try {
            setIsLoading(true);
            await axios.post('/user/logout-all');
            toast.success('Logged out from all devices');

            setAuth(null);
            setUser(null);
            navigate('/login');
        } catch (error) {
            toast.error('Failed to log out from all devices');
            console.log('Error logging out from all devices:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Handle logout from other devices
    const handleLogoutOtherDevices = async () => {
        try {
            setIsLoading(true);
            await axios.post('/user/logout-other-devices');
            toast.success('Logged out from other devices!');
        } catch (error) {
            toast.error('Failed to log out from other devices.');
            console.log('Error logging out from other devices:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Handle account deletion
    const handleDeletion = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

        try {
            setIsLoading(true);
            const userId = user._id;
            await axios.delete(`/user/${userId}`);
            toast.success('Account deleted successfully');
            setAuth(null);
            setUser(null);
            navigate('/');
        } catch (error) {
            console.log('User deletion failed', error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Failed to delete account. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-4 max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Security Settings</h2>

            {/* Password Section */}
            <div className="mb-10">
                <h3 className="text-md font-semibold mb-2">Password</h3>
                {!showPasswordForm ? (
                    <div className="flex items-center justify-between">
                        <p className="text-gray-900">••••••••</p>
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="text-[#fc814a] hover:underline"
                        >
                            Change Password
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center mb-3">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-3/4 border border-gray-300 p-3 rounded-xl"
                            />
                            <button
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="ml-2 text-[#fc814a] hover:underline"
                            >
                                {showCurrentPassword ? 'Hide' : 'View'}
                            </button>
                        </div>
                        <div className="flex items-center mb-3">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-3/4 border border-gray-300 p-3 rounded-xl"
                            />
                            <button
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="ml-2 text-[#fc814a] hover:underline"
                            >
                                {showNewPassword ? 'Hide' : 'View'}
                            </button>
                        </div>
                        <div className="flex items-center mb-3">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm New Password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-3/4 border border-gray-300 p-3 rounded-xl"
                            />
                            <button
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="ml-2 text-[#fc814a] hover:underline"
                            >
                                {showConfirmPassword ? 'Hide' : 'View'}
                            </button>
                        </div>
                        <button
                            onClick={handlePasswordChange}
                            disabled={isLoading}
                            className="px-4 py-2 bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-xl transition-colors duration-300"
                        >
                            Update Password
                        </button>
                        <button
                            onClick={() => setShowPasswordForm(false)}
                            className="ml-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-xl transition-colors duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Log Out From All or Other Devices Section */}
            <div className="mb-10">
                <h3 className="text-md font-semibold mb-2">Log Out</h3>
                <div className='flex gap-4'>
                    <button
                        onClick={handleLogoutOtherDevices}
                        disabled={isLoading}
                        className="px-4 py-2 bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-xl transition-colors duration-300"
                    >
                        Log Out from Other Devices
                    </button>
                    <button
                        onClick={handleLogoutAllDevices}
                        disabled={isLoading}
                        className="px-4 py-2 bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-xl transition-colors duration-300"
                    >
                        Log Out from All Devices
                    </button>
                </div>
            </div>

            {/* Delete Account Section */}
            <div className="mb-6">
                <h3 className="text-md font-semibold text-red-600 mb-2">Delete Account</h3>
                <button
                    onClick={handleDeletion}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-300"
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
};

export default SecuritySettings;
