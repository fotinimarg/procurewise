import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import CategoryDropdown2 from './CategoryDropdown2';

const AddProduct = () => {
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        category: '',
        imageUrl: '',
        specifications: []
    });

    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [categorySpecifications, setCategorySpecifications] = useState([]);
    const [customSpecifications, setCustomSpecifications] = useState([]);

    const handleChange = (e) => {
        setProductData({
            ...productData,
            [e.target.name]: e.target.value
        });
    }

    const handleCategoryChange = async (categoryId, categoryName) => {
        setProductData((prev) => ({
            ...prev,
            category: categoryId,
        }));
        setSelectedCategoryName(categoryName);

        try {
            const response = await axios.get(`/categories/${categoryId}/specifications`);
            setCategorySpecifications(response.data.specifications || []);
        } catch (error) {
            console.error('Error fetching specifications:', error);
            toast.error('Failed to fetch category specifications.');
        }
    }

    const handleSpecificationChange = (index, field, value, type = 'category') => {
        if (type === 'category') {
            const updatedSpecifications = [...categorySpecifications];
            updatedSpecifications[index] = { ...updatedSpecifications[index], value };
            setCategorySpecifications(updatedSpecifications);
        } else if (type === 'custom') {
            const updatedCustomSpecifications = [...customSpecifications];
            updatedCustomSpecifications[index] = { ...updatedCustomSpecifications[index], [field]: value };
            setCustomSpecifications(updatedCustomSpecifications);
        }
    }

    const addCustomSpecification = () => {
        setCustomSpecifications((prev) => [
            ...prev,
            { name: '', value: '', isCustom: true },
        ]);
    }

    const removeCustomSpecification = (index) => {
        setCustomSpecifications((prev) => prev.filter((_, i) => i !== index));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const combinedSpecifications = [
            ...categorySpecifications.map((spec) => ({
                name: spec.name,
                value: spec.value,
            })),
            ...customSpecifications,
        ]

        try {
            const response = await axios.post('/products', {
                ...productData,
                specifications: combinedSpecifications,
            });
            if (response.status === 201) {
                toast.success('Product added successfully!');
                setProductData({ name: '', description: '', category: '', imageUrl: '', specifications: [] });
                setCategorySpecifications([]);
                setCustomSpecifications([]);
            }
        } catch (error) {
            console.log('Product creation error:', error);
            toast.error('Failed to add product.');
        }
    }

    return (
        <div className="p-5">
            <h2 className="mb-8 text-xl text-center font-bold text-[#fc814a]">Add a New Product</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">Name
                        <input
                            type="text"
                            name="name"
                            value={productData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        />
                    </label>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Description
                        <textarea
                            name="description"
                            value={productData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        />
                    </label>
                </div>
                <div className="mb-4">
                    <CategoryDropdown2
                        handleCategoryChange={handleCategoryChange}
                        selectedCategoryName={selectedCategoryName}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Image URL
                        <input
                            type="text"
                            name="imageUrl"
                            value={productData.imageUrl}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        />
                    </label>
                </div>

                {/* Category Specifications */}
                {categorySpecifications.length > 0 && (
                    <>
                        <h4 className="text-gray-700 mb-2">Category Specifications</h4>
                        {categorySpecifications.map((spec, index) => (
                            <div key={index} className="flex gap-4 items-center mb-3">
                                <label className="w-1/3">{spec.name}</label>
                                {spec.possibleValues?.length > 0 ? (
                                    <>
                                        <select
                                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                            value={spec.value || ''}
                                            onChange={(e) =>
                                                handleSpecificationChange(index, 'value', e.target.value, 'category')
                                            }
                                        >
                                            <option value="">Select a value</option>
                                            {spec.possibleValues.map((val, idx) => (
                                                <option key={idx} value={val}>
                                                    {val}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Or enter a custom value"
                                            value={spec.value || ''}
                                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                            onChange={(e) =>
                                                handleSpecificationChange(index, 'value', e.target.value, 'category')
                                            }
                                        />
                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        value={spec.value || ''}
                                        className="w-full px-3 py-2 border rounded-xl"
                                        onChange={(e) =>
                                            handleSpecificationChange(index, 'value', e.target.value, 'category')
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </>
                )}

                {/* Custom Specifications */}
                <h4 className="mb-2 text-gray-700">Custom Specifications</h4>
                {customSpecifications.map((spec, index) => (
                    <div key={index} className="flex gap-4 items-center mb-3">
                        <input
                            type="text"
                            value={spec.name}
                            onChange={(e) =>
                                handleSpecificationChange(index, 'name', e.target.value, 'custom')
                            }
                            placeholder="Specification Name"
                            className="w-1/3 px-2 py-1 border rounded-xl"
                        />
                        <input
                            type="text"
                            value={spec.value}
                            onChange={(e) =>
                                handleSpecificationChange(index, 'value', e.target.value, 'custom')
                            }
                            placeholder="Value"
                            className="w-2/3 px-2 py-1 border rounded-xl"
                        />
                        <button
                            type="button"
                            onClick={() => removeCustomSpecification(index)}
                            className="text-red-500 hover:text-red-700"
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addCustomSpecification}
                    className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors duration-300 mb-4"
                >
                    Add Custom Specification
                </button>

                <button
                    type="submit"
                    className="w-full bg-[#564256] text-white py-2 rounded-xl hover:bg-[#96939b] transition-colors duration-300"
                >
                    Add Product
                </button>
            </form>
        </div>
    );
};

export default AddProduct;
