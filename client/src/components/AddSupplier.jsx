import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AddSupplier = () => {
    const [supplierData, setSupplierData] = useState({
        name: '',
        contact: { email: '', phone: '', address: '' },
        vatNumber: '',
        link: '',
        logo: ''
    });
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setSupplierData({
            ...supplierData,
            [e.target.name]: e.target.value
        });
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
        setIsLoading(true);

        try {
            const response = await axios.post('/suppliers', supplierData);
            if (response.status === 201) {
                console.log(response.supplier)
                toast.success('Supplier added successfully!');
                setSupplierData({
                    name: '',
                    contact: { email: '', phone: '', address: '' },
                    vatNumber: '',
                    link: '',
                    logo: ''
                });
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add supplier.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleFileUpload = async () => {
        if (!file) {
            toast.error('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);

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
            setIsLoading(false);
        }
    }

    if (isLoading) return <p>Loading...</p>;

    return (
        <div className="px-5 bg-white">
            <h2 className="mb-4 text-xl text-center font-bold text-[#fc814a]">Add a New Supplier</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-2">
                    <label className="block text-gray-700">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={supplierData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        required
                    />
                </div>
                <div className='flex gap-4 mb-2'>
                    <div>
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={supplierData.contact.email}
                            onChange={(e) =>
                                setSupplierData({
                                    ...supplierData,
                                    contact: { ...supplierData.contact, email: e.target.value },
                                })
                            }
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={supplierData.contact.phone}
                            onChange={(e) =>
                                setSupplierData({
                                    ...supplierData,
                                    contact: { ...supplierData.contact, phone: e.target.value },
                                })
                            }
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                            required
                        />
                    </div>
                </div>
                <div className="sm:col-span-2 mb-2">
                    <label className="block text-gray-700">Address</label>
                    <input
                        name="address"
                        rows={2}
                        value={supplierData.contact.address}
                        onChange={(e) =>
                            setSupplierData({
                                ...supplierData,
                                contact: { ...supplierData.contact, address: e.target.value },
                            })
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        required
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700">VAT Number</label>
                    <input
                        type="text"
                        name="vatNumber"
                        value={supplierData.vatNumber}
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
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        pattern="\d{9}"
                        title="VAT Number must be exactly 9 digits"
                        required
                    />
                </div>

                <div className="mb-2">
                    <label className="block text-gray-700">Link</label>
                    <input
                        type="link"
                        name="link"
                        value={supplierData.link}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        required
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-gray-700">Logo</label>
                    <input
                        type="link"
                        name="logo"
                        value={supplierData.logo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                </div>
                <button
                    type="submit"
                    className={`mt-6 w-full py-2 rounded-lg transition-colors duration-300 ${isLoading ? 'bg-gray-300 text-gray-700' : 'bg-[#564256] text-white hover:bg-[#96939b]'}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Submitting...' : 'Add Supplier'}
                </button>
            </form >

            {/* File Upload Section */}
            < div className="mt-6" >
                <h3 className="mb-2 text-lg font-semibold text-gray-800">Or Upload Supplier File</h3>
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
            </div >
        </div >
    );
};

export default AddSupplier;
