const Supplier = require('../models/supplier');
const Product = require('../models/product');
const ProductSupplier = require('../models/productSupplier');
const mongoose = require('mongoose');
const { addNewSupplier } = require('../controllers/supplierController')
const { addNewProduct } = require('../controllers/productController')
const { newLink, removeLink } = require('../controllers/productSupplierController');
const { updateMainPrice } = require('../helpers/updates');
const Category = require('../models/category');

const transformCSVToJSON = (csvData) => {
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        throw new Error('Invalid or empty CSV data');
    }

    // Extract supplier details from the first row
    const firstRow = csvData[0];

    const supplier = {
        name: firstRow.supplier_name,
        contact: {
            email: firstRow.supplier_email,
            phone: firstRow.supplier_phone,
            address: firstRow.supplier_address,
        },
        vatNumber: firstRow.supplier_vatNumber,
        link: firstRow.supplier_link,
        logo: firstRow.supplier_logo,
    }

    // Map the remaining rows to products
    const products = csvData.map((row) => ({
        name: row.product_name,
        description: row.product_description,
        category: row.product_category,
        imageUrl: row.product_image_url,
        price: parseFloat(row.product_price),
        quantity: parseInt(row.product_quantity, 10),
    }))

    return {
        supplier,
        products,
    }
}

// Validate Supplier Data
const validateSupplierData = (data) => {
    if (!data.name || !data.contact || (!data.contact.email && !data.contact.phone && !data.contact.address) || !data.link) {
        throw new Error('Supplier data is incomplete');
    }
};

// Validate Product Data
const validateProductData = (product) => {
    if (!product.name || !product.price || !product.quantity) {
        throw new Error('Product data is incomplete');
    }
};

// Handle JSON Data
const handleJSONData = async (data) => {
    try {
        validateSupplierData(data.supplier);

        let supplierId;
        const existingSupplier = await Supplier.findOne({ name: data.supplier.name })

        if (!existingSupplier) {
            const supplier = await addNewSupplier(data.supplier);
            supplierId = supplier._id;
        } else {
            supplierId = existingSupplier._id;

            const updateData = {};
            if (data.supplier.contact) {
                updateData.contact = {
                    email: data.supplier.contact.email,
                    phone: data.supplier.contact.phone,
                    address: data.supplier.contact.address,
                };
            }
            if (data.supplier.vatNumber) updateData.vatNumber = data.supplier.vatNumber;
            if (data.supplier.link) updateData.link = data.supplier.link;
            if (data.supplier.logo) updateData.logo = data.supplier.logo;

            await Supplier.findByIdAndUpdate(supplierId, { $set: updateData });
        }

        const productIds = new Set();
        const priceUpdates = [];
        const quantityUpdates = [];

        // Process each product
        for (const productData of data.products) {
            validateProductData(productData);

            let categoryId = null;
            if (productData.category) {
                const existingCategory = await Category.findOne({ name: productData.category });

                if (!existingCategory) {
                    throw new Error(`Category '${productData.category}' does not exist in the database.`);
                }

                categoryId = existingCategory._id;
            }

            const existingProduct = await Product.findOne({ name: productData.name });
            let productId;
            if (existingProduct) {
                productId = existingProduct._id;
            } else {
                const newProduct = await addNewProduct({
                    name: productData.name,
                    description: productData.description,
                    category: categoryId,
                    imageUrl: productData.imageUrl,
                });
                productId = newProduct._id;
            }

            productIds.add(productId);

            // Check if the product-supplier link exists
            const existingConnection = await ProductSupplier.findOne({
                product: productId,
                supplier: supplierId,
            });

            if (existingConnection) {
                // If the connection exists, update the price and quantity
                if (productData.price !== undefined && Number(productData.price) !== Number(existingConnection.price)) {
                    priceUpdates.push({
                        updateOne: {
                            filter: { _id: existingConnection._id },
                            update: { $set: { price: parseFloat(productData.price) } },
                        },
                    });
                }
                if (productData.quantity !== undefined && Number(productData.quantity) !== Number(existingConnection.quantity)) {
                    quantityUpdates.push({
                        updateOne: {
                            filter: { _id: existingConnection._id },
                            update: { $set: { quantity: parseInt(productData.quantity) } },
                        },
                    });
                }
            } else {
                // Link the product to the supplier
                await newLink(productId, supplierId, parseFloat(productData.price), parseInt(productData.quantity), {
                    skipPriceUpdate: true,
                    skipStockUpdate: true,
                });
            }

        }

        // Fetch and find ProductSupplier links for products not in the JSON file
        const existingProductLinks = await ProductSupplier.find({ supplier: supplierId });

        const productIdStrings = new Set([...productIds].map(id => id.toString()));

        for (const link of existingProductLinks) {
            if (!productIdStrings.has(link.product.toString())) {
                await removeLink(link.product, supplierId, 'supplier');
            }
        }

        // Perform bulk updates if there are any price or quantity changes
        if (priceUpdates.length > 0) {
            await ProductSupplier.bulkWrite(priceUpdates);
        }

        if (quantityUpdates.length > 0) {
            await ProductSupplier.bulkWrite(quantityUpdates);
        }

        // Batch update prices and stock after all connections
        await updateBatchProducts(Array.from(productIds));

        console.log('File import completed successfully.');
    } catch (error) {
        throw new Error(`Error processing JSON data: ${error.message}`);
    }
}

// Handle CSV Data
const handleCSVData = async (csvData) => {
    try {
        // Transform CSV data to the required JSON format
        const jsonData = transformCSVToJSON(csvData);

        await handleJSONData(jsonData);

        console.log('CSV file processed successfully.');
    } catch (error) {
        console.error('Error processing CSV file:', error.message);
        throw new Error(`Error processing CSV file: ${error.message}`);
    }
}

const updateBatchProducts = async (productIds) => {
    try {
        await Promise.all(
            productIds.map(async (productId) => {
                const totalStock = await ProductSupplier.aggregate([
                    { $match: { product: new mongoose.Types.ObjectId(productId) } },
                    { $group: { _id: null, totalStock: { $sum: "$quantity" } } },
                ]);

                const newStock = totalStock.length ? totalStock[0].totalStock : 0;
                await Product.findByIdAndUpdate(productId, { stock: newStock });
                await updateMainPrice(productId);
            })
        );

        console.log('Batch update of prices and stock completed.');
    } catch (error) {
        console.error('Error during batch update:', error);
        throw error;
    }
}

module.exports = { handleJSONData, handleCSVData };