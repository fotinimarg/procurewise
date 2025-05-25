import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, Pencil, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newToggle, setNewToggle] = useState(false);
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [newSubcategoryName, setNewSubcategoryName] = useState('');
    const [parentCategoryId, setParentCategoryId] = useState(null);
    const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
    const [specifications, setSpecifications] = useState([]);

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [newName, setNewName] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Fetch categories based on parent
    const fetchCategories = async (parentId = null) => {
        try {
            const response = await axios.get('/categories', { params: { parentId } });
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }

    // Fetch subcategories of a category
    const fetchSubcategories = async (categoryId) => {
        try {
            const response = await axios.get('/categories', { params: { parentId: categoryId } });
            setExpandedCategories((prev) => ({
                ...prev,
                [categoryId]: response.data,
            }));

        } catch (error) {
            console.error('Error fetching subcategories:', error);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleCategoryExpansion = (categoryId) => {
        if (!expandedCategories[categoryId]) {
            fetchSubcategories(categoryId);
        } else {
            setExpandedCategories((prev) => ({
                ...prev,
                [categoryId]: null,
            }));
        }
    }

    const handleNewClick = () => {
        setNewToggle(!newToggle);
    }

    // Create new root category
    const handleCreateCategory = async () => {
        try {
            await axios.post('/categories', {
                name: newCategoryName,
                description,
                specifications,
                imageUrl: imageUrl
            });

            setNewToggle(false);
            setNewCategoryName('');
            setDescription('');
            setImageUrl('');
            setSpecifications([]);

            fetchCategories();
        } catch (error) {
            console.error('Error creating subcategory:', error);
        }
    }

    const openAddSubcategoryForm = (parentId) => {
        setParentCategoryId(parentId);
        setIsAddingSubcategory(true);
    }

    // Create new subcategory
    const handleCreateSubcategory = async () => {
        if (!parentCategoryId || !newSubcategoryName) return;

        try {
            await axios.post('/categories', {
                name: newSubcategoryName,
                description,
                parentId: parentCategoryId,
                specifications,
                imageUrl: imageUrl
            });
            setNewSubcategoryName('');
            setDescription('');
            setImageUrl('');
            setSpecifications([]);
            setParentCategoryId(null);
            setIsAddingSubcategory(false);

            fetchCategories();
            fetchSubcategories(parentCategoryId);
        } catch (error) {
            console.error('Error adding subcategory:', error);
        }
    }

    const handleDeleteCategory = async (category) => {
        try {
            await axios.delete(`/categories/${category._id}`);

            fetchCategories();
            fetchSubcategories(category.parent);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    }

    const handleSpecificationChange = (index, field, value) => {
        const updatedSpecifications = [...specifications];
        updatedSpecifications[index] = {
            ...updatedSpecifications[index],
            [field]: field === 'possibleValues' ? value.split(',') : value,
        }
        if (field === 'type') {
            updatedSpecifications[index].type = value;
        }
        setSpecifications(updatedSpecifications);
    }

    const addSpecification = () => {
        setSpecifications([...specifications, { name: '', type: 'String', possibleValues: '', required: false }]);
    }

    const removeSpecification = (index) => {
        const updatedSpecifications = specifications.filter((_, i) => i !== index);
        setSpecifications(updatedSpecifications);
    }

    const handleEditClick = (category) => {
        setEditingCategoryId(category._id);
        setNewName(category.name);
        setDescription(category.description);
        setImageUrl(category.imageUrl);
        setSpecifications(category.specifications || []);
    }

    const handleEditCategory = async (categoryId) => {
        try {
            await axios.put(`/categories/${categoryId}`, { name: newName, description: description, imageUrl: imageUrl, specifications: specifications });

            setEditingCategoryId(null);
            setNewName('');
            setDescription('');
            setImageUrl('');
            setSpecifications([]);

            fetchCategories();
        } catch (error) {
            console.error('Error editing category name:', error);
        }
    }

    const renderCategories = (categories, parentId = null, expandedCategories, toggleCategoryExpansion, handleEditClick, handleDeleteCategory, openAddSubcategoryForm) => {
        return (
            <ul>
                {categories
                    .filter((category) => category.parent === parentId)
                    .map((category) => (
                        <li key={category._id} className="mb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleCategoryExpansion(category._id)}
                                        className="text-gray-500 hover:text-gray-800"
                                    >
                                        {expandedCategories[category._id] ? <ChevronDown /> : <ChevronRight />}
                                    </button>
                                    <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className="w-10 h-10 rounded-md object-cover"
                                    />
                                    <Link
                                        to={`/categories/${category.slug}`}
                                        className="ml-2">
                                        {category.name}
                                    </Link>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleEditClick(category)}
                                        className="
                                         text-gray-500 hover:text-gray-800
                                         transition-colors duration-300"
                                    >
                                        <Pencil size={21} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category)}
                                        className="text-gray-500 hover:text-red-600 transition-colors duration-300"
                                    >
                                        <Trash2 size={22} />
                                    </button>
                                    <button
                                        onClick={() => openAddSubcategoryForm(category._id)}
                                        className="bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-2 transition-colors duration-300 flex gap-2 items-center"
                                    >
                                        <PlusCircle size={18} />
                                        <span>Subcategory</span>
                                    </button>
                                </div>
                            </div>

                            {/* Render Subcategories */}
                            {expandedCategories[category._id] && (
                                <div className="ml-6 mt-2 border-l border-gray-300 pl-4">
                                    {expandedCategories[category._id].length > 0 ? (
                                        renderCategories(
                                            expandedCategories[category._id],
                                            category._id,
                                            expandedCategories,
                                            toggleCategoryExpansion, handleEditClick, handleDeleteCategory, openAddSubcategoryForm
                                        )
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            No subcategories yet.
                                        </p>)}
                                </div>
                            )}
                        </li>
                    ))}
            </ul>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-screen-xl">
            <div className='flex justify-between mb-3 items-center relative'>
                <h1 className="text-2xl font-semibold mb-4">Manage Categories</h1>

                {/* Add New Category Button */}
                <div className="flex justify-between mb-4">
                    <button
                        onClick={handleNewClick}
                        className="bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1.5 transition-colors duration-300 flex gap-2 items-center"
                    >
                        <PlusCircle size={18} />
                        <span>New</span>
                    </button>
                </div>

                {/* Add New Category */}
                {newToggle && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                        <div className="relative bg-white rounded-xl p-6 shadow-xl w-fit">

                            {/* Close Button */}
                            <button
                                className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                onClick={() => {
                                    setNewToggle(false);
                                    setDescription('');
                                    setNewCategoryName('');
                                    setImageUrl('');
                                }}>
                                ×
                            </button>

                            <div>
                                <h3 className="text-base font-semibold mb-2">Add Category</h3>

                                <div className='flex gap-4'>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Category Name"
                                        className="w-1/2 border p-2 rounded-xl mb-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Image Url"
                                        name="imageUrl"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-1/2 border p-2 rounded-xl mb-2"
                                    />
                                </div>
                                <textarea
                                    type="text"
                                    rows={3}
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border p-2 rounded-xl mb-2"
                                />
                            </div>

                            <div className="mt-6 text-end">
                                <button
                                    onClick={handleCreateCategory}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors duration-300"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
                {renderCategories(categories, null, expandedCategories, toggleCategoryExpansion, handleEditClick, handleDeleteCategory, openAddSubcategoryForm)}
            </div>

            {/* Add New Subcategory */}
            {isAddingSubcategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="relative bg-white rounded-xl p-6 shadow-xl w-auto max-h-[90vh] overflow-auto">

                        {/* Close Button */}
                        <button
                            className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                            onClick={() => {
                                setIsAddingSubcategory(false);
                                setDescription('');
                                setNewSubcategoryName('');
                                setImageUrl('');
                                setSpecifications([]);
                            }}>
                            ×
                        </button>
                        <h3 className="text-lg font-semibold mb-4">Add Subcategory</h3>

                        <div className='flex justify-between gap-4'>
                            <input
                                type="text"
                                value={newSubcategoryName}
                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                placeholder="Subcategory Name"
                                className="w-1/2 border p-2 rounded-xl mb-2"
                            />
                            <input
                                type="text"
                                placeholder="Image Url"
                                name="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-1/2 border p-2 rounded-xl mb-2"
                            />
                        </div>
                        <textarea
                            value={description}
                            rows={3}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full border p-2 rounded-xl mb-2"
                        />

                        {/* Specifications */}
                        <h4 className="font-medium mb-2">Specifications</h4>
                        {specifications.map((spec, index) => (
                            <div key={index} className="flex items-center gap-3 mb-2">
                                <input
                                    type="text"
                                    placeholder="Specification Name"
                                    value={spec.name}
                                    onChange={(e) =>
                                        handleSpecificationChange(index, 'name', e.target.value)
                                    }
                                    className="w-1/3 border p-2 rounded-xl"
                                />
                                <input
                                    type="text"
                                    placeholder="Possible Values (comma-separated)"
                                    value={spec.possibleValues}
                                    onChange={(e) =>
                                        handleSpecificationChange(index, 'possibleValues', e.target.value)
                                    }
                                    className="w-1/2 border p-2 rounded-xl"
                                />
                                <label className="flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={spec.required}
                                        onChange={(e) =>
                                            handleSpecificationChange(index, 'required', e.target.checked)
                                        }
                                    />
                                    Required
                                </label>
                                <button
                                    onClick={() => removeSpecification(index)}
                                    className="text-red-500 hover:text-red-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {/* Add Specification Button */}
                        <button
                            onClick={addSpecification}
                            className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors duration-300 w-52 mb-4"
                        >
                            Add Specification
                        </button>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCreateSubcategory}
                                className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors duration-300"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category */}
            {editingCategoryId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="relative bg-white p-6 rounded-xl shadow-lg w-fit max-h-[90vh] overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
                        <form onSubmit={(e) => e.preventDefault()} className='flex flex-col justify-between min-h-0'>

                            {/* Close Button */}
                            <button
                                className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                onClick={() => {
                                    setEditingCategoryId(null);
                                    setNewName('');
                                    setDescription('');
                                    setImageUrl('');
                                    setSpecifications([]);
                                }}>
                                ×
                            </button>
                            <div className='flex-grow'>
                                <div className='flex gap-4'>
                                    <div className="mb-4 w-1/2">
                                        <label className="block text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full border p-2 rounded-xl"
                                        />
                                    </div>
                                    <div className="mb-4 w-1/2">
                                        <label className="block text-gray-700">Image Url</label>
                                        <input
                                            type="text"
                                            name="imageUrl"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            className="w-full border p-2 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700">Description</label>
                                    <textarea
                                        type="text"
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full border p-2 rounded-xl"
                                    />
                                </div>


                                {/* Specifications */}
                                <h4 className="font-medium mb-2">Specifications</h4>
                                {specifications?.map((spec, index) => (
                                    <div key={index} className="flex items-center gap-3 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Specification Name"
                                            value={spec.name}
                                            onChange={(e) =>
                                                handleSpecificationChange(index, 'name', e.target.value)
                                            }
                                            className="w-1/3 border p-2 rounded-xl"
                                        />
                                        <select
                                            value={spec.type}
                                            onChange={(e) => handleSpecificationChange(index, 'type', e.target.value)}
                                            className="w-40 border p-2 rounded-xl"
                                        >
                                            <option value="String">String</option>
                                            <option value="Number">Number</option>
                                            <option value="Boolean">Boolean</option>
                                        </select>

                                        <input
                                            type="text"
                                            placeholder="Possible Values (comma-separated)"
                                            value={(Array.isArray(spec.possibleValues) ? spec.possibleValues : []).join(',')}
                                            onChange={(e) =>
                                                handleSpecificationChange(index, 'possibleValues', e.target.value)
                                            }
                                            className="w-1/2 border p-2 rounded-xl"
                                        />
                                        <label className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={spec.required}
                                                onChange={(e) =>
                                                    handleSpecificationChange(index, 'required', e.target.checked)
                                                }
                                            />
                                            Required
                                        </label>
                                        <button
                                            onClick={() => removeSpecification(index)}
                                            className="text-red-500 hover:text-red-800"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {/* Add Specification Button */}
                                <button
                                    onClick={addSpecification}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors duration-300 w-52 mb-4"
                                >
                                    Add Specification
                                </button>
                            </div>
                            <div className="text-end mt-auto">
                                <button
                                    className="bg-[#fc814a] text-white px-4 py-2 rounded-xl hover:bg-[#fc5f18] transition-colors duration-300"
                                    onClick={() => handleEditCategory(editingCategoryId)}
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminCategoriesPage;