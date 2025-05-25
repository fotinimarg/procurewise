import { useState } from "react";
import { motion } from "framer-motion";

const FilterSidebar = ({
    products,
    isOpen,
    onClose,
    onCancel,
    selectedFilters,
    setSelectedFilters,
    onApplyFilters
}) => {
    const extractSpecifications = (products) => {
        const specsMap = new Map();

        products.forEach(product => {
            product.specifications.forEach(spec => {
                if (!specsMap.has(spec.name)) {
                    specsMap.set(spec.name, new Set());
                }
                specsMap.get(spec.name).add(spec.value);
            });
        });

        return Object.fromEntries(
            Array.from(specsMap, ([key, values]) => [
                key,
                Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            ])
        );
    }

    const specifications = extractSpecifications(products);

    const handleSpecificationChange = (specName, value, isChecked) => {
        setSelectedFilters(prevFilters => {
            const updatedFilters = { ...prevFilters };
            if (!updatedFilters.specifications) updatedFilters.specifications = {};

            if (isChecked) {
                updatedFilters.specifications[specName] = [
                    ...(updatedFilters.specifications[specName] || []),
                    value
                ];
            } else {
                if (updatedFilters.specifications[specName]) {
                    updatedFilters.specifications[specName] = updatedFilters.specifications[specName].filter(v => v !== value);

                    if (updatedFilters.specifications[specName].length === 0) {
                        delete updatedFilters.specifications[specName];
                    }
                }
            }
            return updatedFilters;
        });
    }

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setSelectedFilters(prevFilters => ({
            ...prevFilters,
            [name]: value ? parseFloat(value) : ""
        }));
    }

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: isOpen ? "0%" : "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                style={{ zIndex: 1100 }}
                className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg p-6 overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
                </div>

                {/* Specifications */}
                {Object.entries(specifications).map(([specName, values]) => (
                    <div key={specName} className="mb-3">
                        <h3 className="font-medium">{specName}</h3>
                        {values.map(value => (
                            <label key={value} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    value={value}
                                    checked={selectedFilters.specifications?.[specName]?.includes(value) || false}
                                    onChange={(e) => handleSpecificationChange(specName, value, e.target.checked)}
                                />
                                {value}
                            </label>
                        ))}
                    </div>
                ))}

                {/* Price Filter */}
                <div className="mb-4">
                    <label className="font-medium">Price Range (€)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            name="minPrice"
                            value={selectedFilters.minPrice || ""}
                            onChange={handlePriceChange}
                            className="w-1/2 px-3 py-2 border rounded-xl"
                            placeholder="Min"
                        />
                        <input
                            type="number"
                            name="maxPrice"
                            value={selectedFilters.maxPrice || ""}
                            onChange={handlePriceChange}
                            className="w-1/2 px-3 py-2 border rounded-xl"
                            placeholder="Max"
                        />
                    </div>
                </div>

                <div className="flex justify-between">
                    <button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-3 py-1 text-sm transition-colors duration-200">Cancel</button>
                    <button onClick={() => onApplyFilters(selectedFilters)} className="bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-xl px-3 py-1 text-sm transition-colors duration-200">Apply</button>
                </div>
            </motion.div>
        </>
    );
}

export default FilterSidebar;