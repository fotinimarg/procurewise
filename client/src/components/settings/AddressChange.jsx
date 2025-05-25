import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import UserContext from '../../../context/userContext';
import RegionSelect from '../RegionSelect';

const AddressChange = () => {
    const [addresses, setAddresses] = useState([]);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', postalCode: '', region: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [updatedAddress, setUpdatedAddress] = useState({ street: '', city: '', postalCode: '' });
    const { setUser } = useContext(UserContext);
    const isPostalCodeValid = (postalCode) => /^\d{5}$/.test(postalCode);
    const [postalCodeError, setPostalCodeError] = useState('');

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const { data } = await axios.get('/user/address');
                setAddresses(data);
            } catch (error) {
                console.log('Error fetching addresses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAddress();
    }, [isAdding]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;

        if (name === 'postalCode' && !isPostalCodeValid(value)) {
            setPostalCodeError('Postal code must be exactly 5 digits.');
        } else {
            setPostalCodeError('');
        }

        setNewAddress((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditAddressChange = (e) => {
        const { name, value } = e.target;

        if (name === 'postalCode' && !isPostalCodeValid(value)) {
            setPostalCodeError('Postal code must be exactly 5 digits.');
        } else {
            setPostalCodeError('');
        }

        setUpdatedAddress((prev) => ({ ...prev, [name]: value }));
    };

    const addAddress = async () => {
        if (postalCodeError || !isPostalCodeValid(newAddress.postalCode)) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            const { data } = await axios.post('/user/address', { address: newAddress });

            if (data && data.address) {
                setAddresses([...addresses, data.address]);
            } else {
                console.log('Failed to retrieve address from response.')
            }
            setNewAddress({ street: '', city: '', postalCode: '', region: '' });
            setIsAdding(false);

            setUser((prevUser) => ({
                ...prevUser,
                address: data.address
            }));
        } catch (error) {
            console.error('Error adding address:', error);
        }
    };

    const startEditingAddress = (addressId) => {
        const addressToEdit = addresses.find((address) => address._id === addressId);
        if (addressToEdit) {
            setEditingAddressId(addressId);
            setUpdatedAddress(addressToEdit);
        }
    };

    const updateAddress = async () => {
        if (postalCodeError || !isPostalCodeValid(updatedAddress.postalCode)) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            await axios.put('/user/address', { id: editingAddressId, address: updatedAddress });
            setAddresses((prevAddresses) =>
                prevAddresses.map((address) =>
                    address._id === editingAddressId ? { ...address, ...updatedAddress } : address
                )
            );
            setEditingAddressId(null);
            setUpdatedAddress({ street: '', city: '', postalCode: '', region: '' });

            setUser((prevUser) => ({
                ...prevUser,
                address: prevUser.address.map((address) =>
                    address._id === editingAddressId ? { ...address, ...updatedAddress } : address
                ),
            }));
        } catch (error) {
            console.error('Error updating address:', error);
        }
    }
    const setPrimaryAddress = async (id) => {
        try {
            await axios.put('/user/address/primary', { id });
            setAddresses((prevAddresses) =>
                prevAddresses.map((address) =>
                    address._id === id
                        ? { ...address, isPrimary: true }
                        : { ...address, isPrimary: false }
                )
            );

            setUser((prevUser) => ({
                ...prevUser,
                address: prevUser.address.map((address) =>
                    address._id === id
                        ? { ...address, isPrimary: true }
                        : { ...address, isPrimary: false }
                ),
            }));
            toast.success('Primary address updated successfully');
        } catch (error) {
            console.error('Error setting primary address:', error);
            toast.error('Failed to set primary address. Please try again.');
        }
    }

    const deleteAddress = async (id) => {
        try {
            await axios.delete(`/user/address/${id}`);
            setAddresses(addresses.filter((address) => address._id !== id));

            setUser((prevUser) => ({
                ...prevUser,
                address: prevUser.address.filter((address) => address._id !== id),
            }));
            toast.success('Address deleted successfully');
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error('Failed to delete address. Please try again.');
        }
    };

    if (loading) return <p>Loading addresses...</p>;

    return (
        <div className="p-4 max-w-lg">
            <h2 className="text-lg font-semibold mb-4">My Addresses</h2>
            {addresses.length === 0 && !isAdding ? (
                <NoAddresses onAdd={() => setIsAdding(true)} />
            ) : (
                <AddressList
                    addresses={addresses}
                    onEdit={startEditingAddress}
                    onDelete={deleteAddress}
                    editingAddressId={editingAddressId}
                    updatedAddress={updatedAddress}
                    onEditChange={handleEditAddressChange}
                    onUpdate={updateAddress}
                    onAddNew={() => setIsAdding(true)}
                    postalCodeError={postalCodeError}
                    onSetPrimary={setPrimaryAddress}
                />
            )}
            {isAdding && (
                <AddressForm
                    address={newAddress}
                    onChange={handleAddressChange}
                    onSave={addAddress}
                    onCancel={() => { setIsAdding(false), setNewAddress({ street: '', city: '', postalCode: '', region: '' }), setPostalCodeError('') }}
                    postalCodeError={postalCodeError}
                />
            )}
        </div>
    );
}

const NoAddresses = ({ onAdd }) => (
    <div>
        <p className="text-gray-700 mb-4">No saved addresses. Add one below:</p>
        <button className="text-[#fc814a] hover:underline" onClick={onAdd}>
            Add Address
        </button>
    </div>
)

const AddressList = ({
    addresses = [],
    onEdit,
    onDelete,
    editingAddressId,
    updatedAddress,
    onEditChange,
    onUpdate,
    onAddNew,
    postalCodeError,
    onSetPrimary
}) => (
    <div>
        {addresses.map((address) => (
            <div key={address._id} className="mb-4">
                {editingAddressId === address._id ? (
                    <EditAddressForm
                        address={updatedAddress}
                        onChange={onEditChange}
                        onSave={onUpdate}
                        postalCodeError={postalCodeError}
                    />
                ) : (
                    <AddressItem
                        address={address}
                        onEdit={() => onEdit(address._id)}
                        onDelete={() => onDelete(address._id)}
                        onSetPrimary={onSetPrimary}
                    />
                )}
            </div>
        ))}
        <button className="mt-4 text-[#fc814a] hover:underline" onClick={onAddNew}>
            Add New Address
        </button>
    </div>
)

const AddressItem = ({ address, onEdit, onDelete, onSetPrimary }) => (
    <div className="flex justify-between items-center">
        <div className={`w-3/4 border border-gray-300 rounded-xl p-3 flex justify-between items-center ${address.isPrimary ? 'bg-[#E8E8E8]' : ''}`}>
            <div>
                <p>{address.street}</p>
                <p>{address.city}, {address.postalCode}</p>
                <p>{address.region}</p>
            </div>
            <div className='flex items-center gap-5'>
                <p className='text-red-600'>{address.isPrimary ? ('Primary') : ('')}</p>
                {!address.isPrimary && (
                    <button
                        className="text-blue-500 hover:underline"
                        onClick={() => onSetPrimary(address._id)}
                    >
                        Set as Primary
                    </button>
                )}
                <Trash onClick={onDelete} className="size-4 mr-1 text-gray-800 cursor-pointer" />
            </div>
        </div>
        <button className="text-[#fc814a] hover:underline" onClick={onEdit}>Edit</button>
    </div>
)

const EditAddressForm = ({ address, onChange, onSave, postalCodeError }) => (
    <div>
        <input
            type="text"
            name="street"
            value={address.street}
            onChange={onChange}
            placeholder="Street"
            className="w-full border border-gray-400 rounded-xl p-3 mb-2"
        />
        <input
            type="text"
            name="city"
            value={address.city}
            onChange={onChange}
            placeholder="City"
            className="w-full border border-gray-400 rounded-xl p-3 mb-2"
        />
        <input
            type="text"
            name="postalCode"
            value={address.postalCode}
            onChange={onChange}
            placeholder="Postal Code"
            className={`w-full border rounded-xl p-3 mb-2 ${postalCodeError ? 'border-red-500' : 'border-gray-400'}`}
        />
        {postalCodeError && (
            <p className="my-1 text-red-500 text-sm">{postalCodeError}</p>
        )}

        <RegionSelect value={address.region}
            onChange={(selectedValue) => onChange({ target: { name: 'region', value: selectedValue } })} />

        <button onClick={onSave}
            disabled={postalCodeError}
            className="text-[#fc814a] hover:underline">Save</button>
    </div>
)

const AddressForm = ({ address, onChange, onSave, onCancel, postalCodeError }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-3 mt-4 max-w-lg">
        <input
            type="text"
            name="street"
            value={address.street}
            onChange={onChange}
            placeholder="Street"
            className="w-full border border-gray-400 rounded-xl p-3"
        />
        <input
            type="text"
            name="city"
            value={address.city}
            onChange={onChange}
            placeholder="City"
            className="w-full border border-gray-400 rounded-xl p-3"
        />
        <input
            type="text"
            name="postalCode"
            value={address.postalCode}
            onChange={onChange}
            placeholder="Postal Code"
            className={`w-full border rounded-xl p-3 mb-2 ${postalCodeError ? 'border-red-500' : 'border-gray-400'}`}
        />
        {postalCodeError && (
            <p className="my-1 text-red-500 text-sm">{postalCodeError}</p>
        )}

        <RegionSelect value={address.region}
            onChange={(selectedValue) => onChange({ target: { name: 'region', value: selectedValue } })} />

        <button
            type="submit"
            disabled={postalCodeError}
            className="px-4 py-2 bg-[#fc814a] hover:bg-[#fc5f18] transition-colors duration-300 text-white rounded-xl">
            Save Address
        </button>
        <button type="button" onClick={onCancel} className="ml-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-xl transition-colors duration-300">Cancel</button>
    </form>
)

export default AddressChange;
