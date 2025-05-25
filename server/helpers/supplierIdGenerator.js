const generateSupplierId = async (supplierName, SupplierModel) => {
    let supplierId;
    let isUnique = false;

    // Remove spaces from supplier name
    const newSupplierName = supplierName.replace(/\s+/g, '');

    while (!isUnique) {
        // Generate a supplierId
        const prefix = newSupplierName.slice(0, 3).toUpperCase();
        const randomNumber = Math.floor(10000 + Math.random() * 90000);

        supplierId = `${prefix}${randomNumber}`;

        // Check for uniqueness
        const existingSupplier = await SupplierModel.findOne({ supplierId });
        if (!existingSupplier) {
            isUnique = true;
        }
    }

    return supplierId;
};

module.exports = generateSupplierId;
