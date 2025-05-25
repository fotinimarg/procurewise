import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash } from 'lucide-react';
import UserContext from '../../../context/userContext';

const PhoneNumber = () => {
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [newPhoneNumber, setNewPhoneNumber] = useState({ number: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingPhoneNumberId, setEditingPhoneNumberId] = useState(null);
    const [updatedPhoneNumber, setUpdatedPhoneNumber] = useState({ number: '' });
    const { setUser } = useContext(UserContext);
    const isPhoneValid = (number) => /^\d{10}$/.test(number);
    const [phoneNumberError, setPhoneNumberError] = useState('');

    useEffect(() => {
        const fetchPhoneNumbers = async () => {
            try {
                const response = await axios.get('/user/phone-number');
                setPhoneNumbers(response.data);
            } catch (error) {
                console.log('Error fetching phone numbers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPhoneNumbers();
    }, [isAdding]);

    const handleAddChange = (e) => {
        const { value } = e.target;
        if (!isPhoneValid(value)) {
            setPhoneNumberError('Phone number must be exactly 10 digits.');
        } else {
            setPhoneNumberError('');
        }

        setNewPhoneNumber({ number: value });
    }

    // Handle adding new phone number
    const handleAddPhoneNumber = async () => {
        if (phoneNumberError || !isPhoneValid(newPhoneNumber.number)) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            const { data } = await axios.post('/user/phone-number', { phoneNumber: newPhoneNumber.number });

            if (data) {
                setPhoneNumbers((prev) => {
                    const updated = [...prev, data.phoneNumber];
                    return updated;
                });
                setUser((prevUser) => ({
                    ...prevUser,
                    phoneNumber: data.phoneNumber
                }));

                toast.success('Phone number added successfully.');
            } else {
                console.log('Failed to retrieve phone number from response.')
            }
            setNewPhoneNumber({ number: '' });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding phone number:', error);
            toast.error('Failed to add phone number. Please try again.');
        }
    }

    const handleEditChange = (e) => {
        const { value } = e.target;

        if (!isPhoneValid(value)) {
            setPhoneNumberError('Phone number must be exactly 10 digits.');
        } else {
            setPhoneNumberError('');
        }

        setUpdatedPhoneNumber({ number: value });
    }

    // Set number to change
    const handleEditPhoneNumber = (phoneNumberId) => {
        setEditingPhoneNumberId(phoneNumberId);
        const phoneToEdit = phoneNumbers.find((number) => number._id === phoneNumberId);
        setUpdatedPhoneNumber(phoneToEdit ? { number: phoneToEdit.number } : { number: '' });
    };

    // Handle updating phone number
    const handleUpdatePhoneNumber = async () => {
        if (phoneNumberError || !isPhoneValid(updatedPhoneNumber.number)) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            const response = await axios.put('/user/phone-number', { id: editingPhoneNumberId, phoneNumber: updatedPhoneNumber.number });
            setPhoneNumbers(phoneNumbers.map((number) =>
                number._id === editingPhoneNumberId ? { ...number, ...updatedPhoneNumber } : number
            ));
            setEditingPhoneNumberId(null);
            setUpdatedPhoneNumber({ number: '' });
            toast.success('Phone number updated successfully.');

            setUser((prevUser) => ({
                ...prevUser,
                phoneNumber: prevUser.phoneNumber.map((number) =>
                    number._id === editingPhoneNumberId ? { ...number, ...updatedPhoneNumber } : number)
            }));
        } catch (error) {
            console.error('Error updating phone number:', error);
            toast.error('Failed to update phone number. Please try again.');
        }
    };

    // Handle deleting phone number
    const deletePhoneNumber = async (id) => {
        try {
            await axios.delete(`/user/phone-number/${id}`);
            setPhoneNumbers(phoneNumbers.filter((number) => number._id !== id));

            setUser((prevUser) => ({
                ...prevUser,
                phoneNumber: prevUser.phoneNumber.filter((number) => number._id !== id),
            }));

            toast.success('Phone number deleted successfully.');
        } catch (error) {
            console.error('Error deleting phone number:', error);
            toast.error('Failed to delete phone number. Please try again.');
        }
    };

    if (loading) return <p>Loading phone numbers...</p>;

    return (
        <div className="p-4 max-w-lg">
            <h2 className="text-lg font-semibold mb-4">My Phone Numbers</h2>

            {phoneNumbers.length === 0 && !isAdding ? (
                <div>
                    <p className="text-gray-700 mb-4">No saved phone numbers. Add one below:</p>
                    <button className="text-[#fc814a] hover:underline" onClick={() => setIsAdding(true)}>
                        Add Phone Number
                    </button>
                </div>
            ) : (
                <div>
                    {phoneNumbers.map((number) => (
                        <div key={number._id} className="mb-4">
                            {editingPhoneNumberId === number._id ? (
                                <div>
                                    <div className='flex justify-between'>
                                        <input
                                            type="text"
                                            name="numberUpdate"
                                            value={updatedPhoneNumber.number}
                                            onChange={handleEditChange}
                                            maxLength={10}
                                            className={`w-3/4 border rounded-xl p-3 mb-2 ${phoneNumberError ? 'border-red-500' : 'border'}`}
                                        />

                                        <button onClick={handleUpdatePhoneNumber} className="mr-2 text-[#fc814a] hover:underline">
                                            Save
                                        </button>
                                    </div>
                                    {phoneNumberError && (
                                        <p className="my-1 mb-2 text-red-500 text-sm">{phoneNumberError}</p>
                                    )}
                                </div>
                            ) : (
                                <div className='flex justify-between items-center'>
                                    <div className="w-3/4 border border-gray-300 p-3 rounded-xl flex justify-between items-center">
                                        <p>{number.number}</p>

                                        <Trash
                                            onClick={() => deletePhoneNumber(number._id)}
                                            className='size-4 text-gray-800 mr-1 hover:cursor-pointer'
                                        />
                                    </div>
                                    <button
                                        className='text-[#fc814a] hover:underline'
                                        onClick={() => handleEditPhoneNumber(number._id)}>
                                        Edit
                                    </button>

                                </div>
                            )}
                        </div>
                    ))}

                    <button className="mt-4 text-[#fc814a] hover:underline" onClick={() => setIsAdding(true)}>
                        Add New Phone Number
                    </button>
                </div>
            )}

            {isAdding && (
                <div className="mt-4 max-w-lg">
                    <form onSubmit={(e) => { e.preventDefault(); handleAddPhoneNumber(); }} className="space-y-3">
                        <input
                            type="text"
                            value={newPhoneNumber.number}
                            onChange={handleAddChange}
                            placeholder="Phone Number"
                            maxLength={10}
                            minLength={10}
                            pattern="\d{10}"
                            className={`w-3/4 border rounded-xl p-3 mb-2 ${phoneNumberError ? 'border-red-500' : 'border'}`}
                        />

                        {phoneNumberError && (
                            <p className="my-1 mb-2 text-red-500 text-sm">{phoneNumberError}</p>
                        )}

                        <button type="submit" className="px-4 py-2 bg-[#fc814a] hover:bg-[#fc5f18] transition-colors duration-300 text-white rounded-xl">
                            Save Phone Number
                        </button>
                        <button
                            type="button"
                            className="ml-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-xl transition-colors duration-300"
                            onClick={() => { setIsAdding(false), setNewPhoneNumber(''), setPhoneNumberError('') }}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PhoneNumber;
