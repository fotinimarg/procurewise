import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Reviews from '../components/Reviews';
import FavoriteButton from '../components/FavoriteButton';
import ProductSuppliers from '../components/ProductSuppliers';
import Rating from '../components/Rating';
import AddToCartOrEdit from '../components/AddToCartOrEdit';
import AuthContext from '../../context/AuthProvider';
import toast from 'react-hot-toast';
import QuantitySelector from '../components/QuantitySelector';

const ProductDetail = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showQuantitySelector, setShowQuantitySelector] = useState(false);
    const { auth } = useContext(AuthContext);

    const reviewsRef = useRef(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/products/${productId}`);
                setProduct(response.data.product);
                setSelectedSupplier(response.data.lowestPriceSupplier);
            } catch (error) {
                console.log('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [product]);

    const scrollToReviews = () => {
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const handleAddToCart = async () => {
        setShowQuantitySelector(true);
    }

    const handleAddToCartFinal = async () => {
        if (!selectedSupplier) {
            toast.error('No suppliers available for this product.');
            return;
        }

        try {
            await axios.post('/cart', {
                productSupplierId: selectedSupplier._id,
                quantity: quantity,
            },
                { withCredentials: true }
            );

            setShowQuantitySelector(false);
            toast.success('Product added to cart successfully!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (error.response) {
                if (error.response.status === 400 && error.response.data.error === 'Stock is not sufficient for the specified quantity.') {
                    toast.error('Insufficient stock for the requested quantity.');
                } else {
                    toast.error(error.response.data.error || 'Failed to add product to cart.');
                }
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        }
    }

    const handleQuantityChange = (newQuantity) => {
        setQuantity(newQuantity);
    }

    if (loading) return <p>Loading...</p>;
    if (!product) return <p>Product not found.</p>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl ">
            <div className='container bg-white rounded-xl p-6 shadow-md'>
                <div className="flex flex-col sm:flex-row gap-20 justify-center mx-auto p-10">
                    <div className="flex flex-shrink-0 justify-center w-full sm:w-1/2">
                        <img
                            src={product.imageUrl}
                            alt={product.name} className="w-full max-w-md h-auto rounded-md object-cover" />
                    </div>
                    <div className='flex flex-col justify-between w-full sm:w-1/2 text-left'>
                        <div className='flex flex-col gap-1'>
                            <div className='flex justify-between items-center mb-2 gap-2'>
                                <h1 className="text-3xl font-semibold text-gray-900">{product.name}</h1>
                                <FavoriteButton type='Product' typeId={product._id} />
                            </div>
                            <p className="text-sm text-gray-500">code: <span className="text-xs text-gray-500">{product.productId}</span></p>

                            {/* Rating Component */}
                            <div onClick={scrollToReviews}>
                                <Rating itemId={product._id} itemType='product' />
                            </div>

                            <p className="text-gray-700">{product.description}</p>
                        </div>

                        <div className='flex flex-col items-center'>
                            <p className="text-gray-700 mb-2 text-center">{product.price} €</p>

                            {/* Conditionally render the QuantitySelector */}
                            {showQuantitySelector ? (
                                <div className='text-center'>
                                    <QuantitySelector
                                        maxQuantity={selectedSupplier.quantity}
                                        onQuantityChange={handleQuantityChange}
                                        initialQuantity={quantity}
                                    />
                                    <button
                                        onClick={handleAddToCartFinal}
                                        className="rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white py-2 px-6 mt-1  transition-colors duration-300"
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
                                < AddToCartOrEdit
                                    inStock={product.stock > 0}
                                    onClick={handleAddToCart}
                                    isAdmin={(auth?.user.role === 'admin' ? true : false)}
                                    productId={product.productId}
                                />)}
                        </div>
                    </div>
                </div>

                {/* Suppliers Section */}
                <div className="mx-10">
                    <ProductSuppliers productId={product._id} />
                </div>

                {/* Reviews Section */}
                <div ref={reviewsRef} className="reviews-section mx-10">
                    <Reviews reviewForId={product._id} reviewForType='Product' />
                </div>
            </div>
        </div>
    )
}

export default ProductDetail;
