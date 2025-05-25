import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const SubcategoryPage = () => {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`/products?category=${encodeURIComponent(categoryName)}`);
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, [categoryName]);

    return (
        <div className='p-6 max-w-screen-xl mx-auto'>
            <h1 className='text-2xl text-gray-900 font-semibold mb-6'>{categoryName}</h1>
            <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-center">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div >
    );
}

export default SubcategoryPage;