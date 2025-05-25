import { useEffect, useState } from 'react';
import SupplierCard from './SupplierCard';
import axios from 'axios';
import toast from 'react-hot-toast';
import QuantitySelector from './QuantitySelector';

const ProductSuppliers = ({ productId }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [showQuantitySelector, setShowQuantitySelector] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Fetch suppliers for the product
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get(`/products/${productId}/suppliers`);
                if (response.status === 204) {
                    setSuppliers([]);
                } else {
                    setSuppliers(response.data);
                }
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        }
        fetchSuppliers();
    }, [productId]);

    const handleAddToCart = (supplierId) => {
        setSelectedSupplier(supplierId);
        setShowQuantitySelector(true);
    }

    const handleQuantityChange = (newQuantity) => {
        setQuantity(newQuantity);
    }

    const handleAddToCartFinal = async () => {
        try {
            await axios.post('/cart', {
                productSupplierId: selectedSupplier,
                quantity: quantity
            });
            setShowQuantitySelector(false);
            toast.success('Product added to cart successfully!')
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add product to cart.');
        }
    }

    return (
        <div className="flex flex-col items-start sm:p-4 md:p-6 gap-4">
            {suppliers.length === 0 ? (
                <p></p>
            ) : (
                suppliers.map((supplier) => (
                    <div key={supplier.supplierDetails._id} className='grid sm:grid-cols-2 md:grid-cols-[1fr,2fr] border border-gray-100 rounded-xl w-full items-center'>
                        <SupplierCard key={supplier.supplierDetails._id} supplier={supplier.supplierDetails} />
                        <div className='grid sm:grid-rows-2 md:grid-rows-none md:grid-cols-2 sm:p-2 md:p-4 items-center'>
                            <div className='sm:border-b sm:pb-2 md:border-b-0 md:border-r md:pr-2'>
                                {supplier.supplierDetails.contact
                                    ? Object.entries(supplier.supplierDetails.contact).map(([key, value], index) => (
                                        <p key={index} className="text-sm text-gray-700">
                                            <strong className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value || 'N/A'}
                                        </p>
                                    ))
                                    : <p>No contact information available.</p>}
                            </div>

                            <div className='flex flex-col justify-evenly items-center text-center space-y-2'>
                                <h3>{new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(supplier.price)}</h3>
                                {showQuantitySelector && selectedSupplier === supplier._id ? (
                                    <div>
                                        <QuantitySelector
                                            maxQuantity={supplier.quantity}
                                            onQuantityChange={handleQuantityChange}
                                            initialQuantity={1}
                                        />
                                        <button
                                            onClick={handleAddToCartFinal}
                                            className="rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white py-2 px-6 mt-1 transition-colors duration-300"
                                        >
                                            Add
                                        </button>
                                        <p
                                            className='text-gray-500 hover:text-gray-700 hover:cursor-pointer'
                                            onClick={() => { setShowQuantitySelector(false) }}>
                                            Cancel
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        className='rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white py-2 px-6 transition-colors duration-300'
                                        onClick={() => handleAddToCart(supplier._id)}
                                    >
                                        Add to Cart
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ProductSuppliers;