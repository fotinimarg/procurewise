const Category = require("../models/category");
const Product = require("../models/product");

// Create a slug from category's name
const slugify = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

const getCategory = async (req, res) => {
    const { categoryId } = req.params;

    try {
        const category = await Category.findById(categoryId).populate('subcategories');

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Failed to fetch category' });
    }
}

const getCategoryBySlug = async (req, res) => {
    const { slug } = req.query;

    try {
        const category = await Category.findOne({ slug }).populate('subcategories');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const getCategories = async (req, res) => {
    const { parentId } = req.query;

    try {
        const query = parentId ? { parent: parentId } : { parent: null };
        const categories = await Category.find(query).lean();

        const categoriesWithChildrenInfo = await Promise.all(
            categories.map(async (category) => {
                const hasChildren = await Category.exists({ parent: category._id });
                return { ...category, hasChildren };
            })
        )

        res.status(200).json(categoriesWithChildrenInfo);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
}

const getProducts = async (req, res) => {
    const { categoryId } = req.params;

    try {
        // Find products of a specified category
        const products = await Product.find({ category: categoryId }).populate('category', 'name');

        if (!products.length) {
            return res.status(404).json({ message: 'No products found for this category.' });
        }

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products. Please try again.' });
    }
}

const createCategory = async (req, res) => {
    try {
        const { name, description, parentId, specifications, imageUrl } = req.body;

        const slug = slugify(name);

        const newCategory = new Category({
            name,
            slug,
            description,
            parent: parentId || null,
            specifications,
            imageUrl
        });

        // If parentId is passed add category to parent's subcategories
        if (parentId) {
            const parentCategory = await Category.findById(parentId);

            if (!parentCategory) {
                return res.status(404).json({ message: 'Parent category not found' });
            }

            parentCategory.subcategories.push(newCategory._id);
            await parentCategory.save();
        }
        await newCategory.save();

        res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Failed to create category' });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const categoryToDelete = await Category.findById(categoryId);

        if (!categoryToDelete) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // First delete all subcategories if there are any
        const deleteSubcategories = async (subcategories) => {
            for (let subcategoryId of subcategories) {
                const subcategory = await Category.findById(subcategoryId);
                if (subcategory) {
                    await deleteSubcategories(subcategory.subcategories);
                    await Category.findByIdAndDelete(subcategoryId);
                }
            }
        };

        await deleteSubcategories(categoryToDelete.subcategories);

        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({ message: 'Category and its subcategories deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Failed to delete category' });
    }
}

const editCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description, specifications, imageUrl } = req.body;

        const categoryToUpdate = await Category.findById(categoryId);

        if (!categoryToUpdate) {
            return res.status(404).json({ message: 'Category not found' });
        }

        categoryToUpdate.name = name;

        const slug = slugify(name);
        categoryToUpdate.slug = slug;
        if (description) {
            categoryToUpdate.description = description;
        }
        if (imageUrl) {
            categoryToUpdate.imageUrl = imageUrl;
        }
        if (specifications) {
            categoryToUpdate.specifications = specifications;
        }
        await categoryToUpdate.save();

        res.status(200).json({ message: 'Category name updated successfully', category: categoryToUpdate });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Failed to update category' });
    }
}

const getCategoryHierarchy = async () => {
    const categories = await Category.aggregate([
        {
            $graphLookup: {
                from: "categories",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "parent",
                as: "children",
            },
        },
        {
            $lookup: {
                from: "categories",
                localField: "parent",
                foreignField: "_id",
                as: "parentCategory",
            },
        },
        {
            $project: {
                name: 1,
                slug: 1,
                parent: 1,
                parentSlug: { $arrayElemAt: ["$parentCategory.slug", 0] },
            },
        }
    ]);

    const flattenedCategories = categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        parent: category.parent ? category.parent.toString() : null,
        parentSlug: category.parentSlug || null,
    }));

    return flattenedCategories;
}

const getCategoriesWithHierarchy = async (req, res) => {
    try {
        const categories = await getCategoryHierarchy();
        res.json(categories);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching categories', error: error.message });
    }
}

// Fetch specifications for a given category
const getCategorySpecifications = async (req, res) => {
    const { categoryId } = req.params;

    try {
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const specifications = category.specifications.map((spec) => ({
            name: spec.name,
            type: spec.type,
            unit: spec.unit || null,
            possibleValues: spec.possibleValues || [],
            required: spec.required,
        }));

        res.status(200).json({ specifications });
    } catch (error) {
        console.error('Error fetching category specifications:', error);
        res.status(500).json({ message: 'Failed to fetch specifications' });
    }
}

module.exports = {
    getCategory,
    getCategories,
    getProducts,
    createCategory,
    deleteCategory,
    editCategory,
    getCategoryBySlug,
    getCategoriesWithHierarchy,
    getCategorySpecifications
}