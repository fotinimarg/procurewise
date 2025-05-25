import { useState, useEffect } from "react";
import axios from "axios";

const CategoryFilterDropdown = ({ handleCategoryChange, selectedCategoryName }) => {
    const [dropdown, setDropdown] = useState(false);
    const [currentCategories, setCurrentCategories] = useState([]);
    const [parentCategoryId, setParentCategoryId] = useState(null);
    const [navigationStack, setNavigationStack] = useState([]);

    // Fetch categories
    const fetchCategories = async (parentId = null) => {
        try {
            const response = await axios.get("/categories", { params: { parentId } });
            return response.data;
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
    };

    useEffect(() => {
        // Fetch all categories
        fetchCategories().then((rootCategories) => setCurrentCategories(rootCategories));
    }, []);

    const handleCategoryClick = async (category) => {
        handleCategoryChange(category._id, category.name);
        setDropdown(false);
    };

    const handleArrowClick = async (category) => {
        if (category.hasChildren) {
            // Fetch subcategories and update state
            const subcategories = await fetchCategories(category._id);
            setNavigationStack((prevStack) => [...prevStack, { parentId: parentCategoryId, categories: currentCategories }]);
            setCurrentCategories(subcategories);
            setParentCategoryId(category._id);
        }
    };

    const handleBackClick = (e) => {
        e.stopPropagation();
        if (navigationStack.length > 0) {
            const lastNavigation = navigationStack.pop();
            setCurrentCategories(lastNavigation.categories);
            setParentCategoryId(lastNavigation.parentId);
            setNavigationStack([...navigationStack]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium">Filter by Category</label>
            <div className="relative">
                {/* Dropdown trigger */}
                <button
                    type="button"
                    onClick={() => setDropdown(!dropdown)}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                >
                    {selectedCategoryName || "Select Category"}
                </button>

                {/* Dropdown menu */}
                {dropdown && (
                    <div className="absolute w-full bg-white border rounded-xl shadow-md mt-2 z-20">
                        <div className="p-2">
                            {navigationStack.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBackClick}
                                    className="text-sm text-[#fc814a] mb-2"
                                >
                                    ← Back
                                </button>
                            )}

                            {/* Categories List */}
                            <ul className="space-y-1 overflow-y-auto max-h-60">
                                {currentCategories.map((category) => (
                                    <li
                                        key={category._id}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span onClick={() => handleCategoryClick(category)}>{category.name}</span>
                                            {category.hasChildren && (
                                                <span
                                                    onClick={() => handleArrowClick(category)} className="text-gray-500">→
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryFilterDropdown;
