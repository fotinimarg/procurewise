import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CategoryDropdown2 from '../../components/CategoryDropdown2';

const EditProduct = ({ productId }) => {
    const [product, setProduct] = useState({
        name: '',
        description: '',
        category: '',
        imageUrl: '',
        specifications: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [categorySpecifications, setCategorySpecifications] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [customSpecifications, setCustomSpecifications] = useState([]);

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(`/products/${productId}`);
                setProduct(data.product);

                const { category, specifications } = data.product;

                setSelectedCategory(category);
                setSelectedCategoryName(category.name);

                const predefinedSpecs = specifications.filter(spec => !spec.isCustom);
                const customSpecs = specifications.filter(spec => spec.isCustom);

                setCustomSpecifications(customSpecs);

                if (category) {
                    const categoryResponse = await axios.get(`/categories/${category}/specifications`);
                    const categorySpecs = categoryResponse.data.specifications || [];

                    // Merge category specs with product's existing values
                    const mergedSpecs = categorySpecs.map((catSpec) => {
                        const existingSpec = predefinedSpecs.find(
                            (spec) => spec.name === catSpec.name
                        );
                        return {
                            ...catSpec,
                            value: existingSpec?.value || '',
                        };
                    });

                    setCategorySpecifications(mergedSpecs);
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct((prevProduct) => ({ ...prevProduct, [name]: value }));
    }

    const handleCategoryChange = async (categoryId, categoryName) => {
        setSelectedCategory(categoryId);
        setSelectedCategoryName(categoryName);

        try {
            const { data } = await axios.get(`/categories/${categoryId}/specifications`);
            setCategorySpecifications(
                data.specifications.map((spec) => ({
                    ...spec,
                    value: '',
                }))
            );
        } catch (error) {
            console.error('Error fetching category specifications:', error);
        }
    }

    // Handle specification change (either category or custom)
    const handleSpecificationChange = (index, field, value, isCategory) => {
        const updatedSpecifications = isCategory ? [...categorySpecifications] : [...customSpecifications];
        updatedSpecifications[index] = { ...updatedSpecifications[index], [field]: value };
        isCategory ? setCategorySpecifications(updatedSpecifications) : setCustomSpecifications(updatedSpecifications);
    }

    // Add custom specification
    const addCustomSpecification = () => {
        setCustomSpecifications((prev) => [
            ...prev,
            { name: '', value: '', isCustom: true },
        ]);
    }

    // Remove custom specification
    const removeCustomSpecification = (index) => {
        setCustomSpecifications((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Combine category specifications and custom specifications
        const combinedSpecifications = [
            ...categorySpecifications.map((spec) => ({
                name: spec.name,
                value: spec.value,
                isCustom: false,
            })),
            ...customSpecifications,
        ];

        try {
            await axios.put(`/products/${productId}`, {
                ...product,
                category: selectedCategory,
                specifications: combinedSpecifications,
            });
            toast.success('Product updated successfully');
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product');
        }
    }

    if (loading) return <p>Loading product details...</p>;

    return (
        <div className="p-5 bg-white text-left">
            <h2 className="text-xl font-bold text-[#fc814a] mb-8 text-center">Edit Product</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">Product Name</label>
                    <input
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Description</label>
                    <textarea
                        name="description"
                        rows={4}
                        value={product.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50 overflow-hidden"
                    ></textarea>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Image</label>
                    <input
                        type="text"
                        name="imageUrl"
                        value={product.imageUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                    />
                </div>

                <div className="mb-4">
                    <CategoryDropdown2
                        handleCategoryChange={handleCategoryChange}
                        selectedCategoryName={selectedCategoryName}
                    />
                </div>

                {/* Category Specifications */}
                {categorySpecifications.length > 0 && (
                    <>
                        <h4 className="text-gray-700">Category Specifications</h4>
                        {categorySpecifications.map((spec, index) => (
                            <div key={index} className="flex gap-4 items-center mb-3">
                                <label className="w-1/3">{spec.name}</label>
                                {spec.possibleValues?.length > 0 ? (
                                    <>
                                        <select
                                            className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                            value={
                                                spec.possibleValues.includes(spec.value) ? spec.value : ''
                                            }
                                            onChange={(e) =>
                                                handleSpecificationChange(index, 'value', e.target.value, true)
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
                                                handleSpecificationChange(index, 'value', e.target.value, true)
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
                                            handleSpecificationChange(index, 'value', e.target.value, true)
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </>
                )}

                {/* Custom Specifications */}
                <h4 className="text-gray-700">Custom Specifications</h4>
                {customSpecifications.map((spec, index) => (
                    <div key={index} className="flex gap-4 items-center mb-3">
                        <input
                            type="text"
                            value={spec.name}
                            onChange={(e) =>
                                handleSpecificationChange(index, 'name', e.target.value)
                            }
                            placeholder="Specification Name"
                            className="w-1/3 px-2 py-1 border rounded-xl"
                        />
                        <input
                            type="text"
                            value={spec.value}
                            onChange={(e) =>
                                handleSpecificationChange(index, 'value', e.target.value)
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
                    Save
                </button>
            </form>
        </div>
    );
};

export default EditProduct;
