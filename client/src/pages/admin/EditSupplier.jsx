import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EditSupplier = ({ supplierId }) => {

    const [supplier, setSupplier] = useState({
        name: '',
        contact: { email: '', phone: '', address: '' },
        vatNumber: '',
        link: '',
        logo: ''
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch supplier data
    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await axios.get(`/suppliers/${supplierId}`);

                const data = response.data;
                const contact = data.contact || { email: '', phone: '', address: '' };
                setSupplier({ ...data, contact });
            } catch (error) {
                console.error('Error fetching supplier:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSupplier();
    }, [supplierId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSupplier((prevSupplier) => ({ ...prevSupplier, [name]: value }));
    }

    // Handle changes to contact fields
    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setSupplier((prevSupplier) => ({
            ...prevSupplier,
            contact: {
                ...prevSupplier.contact,
                [name]: value
            }
        }));
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        const allowedTypes = ['application/json', 'text/csv'];

        if (selectedFile && allowedTypes.includes(selectedFile.type)) {
            setFile(selectedFile);
            toast.success('File selected successfully!');
        } else {
            toast.error('Invalid file type. Please select a JSON or CSV file.');
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/suppliers/${supplierId}`, supplier);
            toast.success('Supplier updated successfully');
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast.error('Failed to update supplier');
        }
    }

    const handleFileUpload = async () => {
        if (!file) {
            toast.error('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);

        try {
            const response = await axios.post('/imports/import-supplier', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 200) {
                toast.success('File uploaded successfully!');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to upload file.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p>Loading supplier details...</p>;

    return (
        <div className="px-5 bg-white">
            <h2 className="text-xl font-bold text-[#fc814a] mb-8 text-center">Edit Supplier</h2>
            <form onSubmit={handleSubmit} className='text-left'>
                <div className="mb-2">
                    <label className="block text-gray-700 font-bold">Supplier Name</label>
                    <input
                        type="text"
                        name="name"
                        value={supplier.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        required
                    />
                </div>
                <div className='flex gap-4'>
                    <div className="mb-2 w-5/6">
                        <label className="block text-gray-700 font-bold">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={supplier.contact.email}
                            onChange={handleContactChange}
                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                            required
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-gray-700 font-bold">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={supplier.contact.phone}
                            onChange={handleContactChange}
                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                            required
                        />
                    </div>
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700 font-bold">Address</label>
                    <input
                        name="address"
                        rows={1}
                        value={supplier.contact.address}
                        onChange={handleContactChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        required
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700 font-bold">VAT Number</label>
                    <input
                        type="text"
                        name="vatNumber"
                        value={supplier.vatNumber}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d{0,9}$/.test(value)) {
                                handleChange(e);
                            }
                        }}
                        onBlur={(e) => {
                            if (e.target.value.length !== 9) {
                                toast.error("VAT Number must be exactly 9 digits.");
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        pattern="\d{9}"
                        title="VAT Number must be exactly 9 digits"
                        required
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700 font-bold">Link</label>
                    <input
                        type="link"
                        name="link"
                        value={supplier.link}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700 font-bold">Logo</label>
                    <input
                        type="url"
                        name="logo"
                        value={supplier.logo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-[#564256] text-white py-2 rounded-xl hover:bg-[#96939b] transition-colors duration-300"
                >
                    Save
                </button>
            </form>

            {/* File Upload Section */}
            <div className="mt-4 text-left">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Upload Supplier File</h3>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="mb-4"
                />
                <button
                    onClick={handleFileUpload}
                    className="bg-[#fc814a] text-white py-2 px-4 rounded-lg hover:bg-[#564256] transition-colors duration-300"
                >
                    Upload File
                </button>
            </div>
        </div>
    );
};

export default EditSupplier;
