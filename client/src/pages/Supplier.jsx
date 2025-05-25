import { useEffect, useState, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import FavoriteButton from '../components/FavoriteButton';
import Reviews from '../components/Reviews';
import Rating from '../components/Rating';
import AuthContext from '../../context/AuthProvider';
import SupplierProducts from '../components/SupplierProducts';

const SupplierDetail = () => {
    const { supplierId } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const { auth } = useContext(AuthContext);

    const reviewsRef = useRef(null);

    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await axios.get(`/suppliers/${supplierId}`);
                setSupplier(response.data);
            } catch (error) {
                console.log('Error fetching supplier:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSupplier();
    }, [supplierId]);

    const scrollToReviews = () => {
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    if (loading) return <p>Loading...</p>;
    if (!supplier) return <p>Supplier not found.</p>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl ">
            <div className='container bg-white rounded-xl p-6 px-10 shadow-md'>
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center w-full '>

                    {/* Supplier Logo */}
                    <div className="flex justify-center items-center mb-4 sm:mb-0 w-full sm:w-1/6">
                        <img
                            src={supplier.logo}
                            alt={supplier.name}
                            className="w-fit h-fit object-cover" />
                    </div>

                    {/* Supplier Info */}
                    <div className="flex sm:justify-between w-full items-center p-6">
                        <div className='flex flex-col justify-start w-full sm:w-1/2 text-left mb-4 sm:mb-0'>
                            <h1 className="text-3xl font-semibold text-gray-900">{supplier.name}</h1>

                            {auth?.user.role === 'admin' && (
                                <p className="text-sm text-gray-500 mb-2">code: <span className="text-xs text-gray-500">{supplier.supplierId}</span></p>
                            )}

                            {Object.entries(supplier.contact).map(([key, value], index) => (
                                <p key={index}>
                                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                </p>
                            ))}
                            <a
                                href={supplier.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#fc814a] mb-1 hover:underline"
                            >{supplier.link}</a>

                            {/* Rating Component */}
                            <div onClick={scrollToReviews}>
                                <Rating itemId={supplier._id} itemType='supplier' />
                            </div>
                        </div>

                        {/* Favorite Button */}
                        <div className="flex justify-end w-full sm:w-auto">
                            <FavoriteButton typeId={supplier._id} type='Supplier' size='large'
                            />
                        </div>
                    </div>
                </div>

                {/* Suppliers Section */}
                <SupplierProducts supplierId={supplier._id} />

                {/* Reviews Section */}
                <div ref={reviewsRef}>
                    <Reviews reviewForId={supplier._id} reviewForType='Supplier' />
                </div>
            </div>
        </div>
    );
};

export default SupplierDetail;
