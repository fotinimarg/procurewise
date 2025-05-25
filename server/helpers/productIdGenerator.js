const generateProductId = async (productName, ProductModel) => {
    let productId;
    let isUnique = false;

    // Remove spaces from product name
    const newProductName = productName.replace(/\s+/g, '');

    while (!isUnique) {
        // Generate a productId
        const prefix = newProductName.slice(0, 3).toUpperCase();
        const randomNumber = Math.floor(10000 + Math.random() * 90000);

        productId = `${prefix}${randomNumber}`;

        // Check for uniqueness
        const existingProduct = await ProductModel.findOne({ productId });
        if (!existingProduct) {
            isUnique = true;
        }
    }

    return productId;
};

module.exports = generateProductId;