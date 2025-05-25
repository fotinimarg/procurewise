import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import axios from 'axios';

const SupplierProducts = ({ supplierId }) => {
    const [products, setProducts] = useState([]);

    // Fetch products for the supplier
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`/suppliers/${supplierId}/products`);
                if (response.status === 204) {
                    setProducts([]);
                } else {
                    setProducts(response.data);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        }
        fetchProducts();
    }, [supplierId]);

    return (
        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-center p-6">
            {products.length === 0 ? (
                <p></p>
            ) : (
                products.map((product) => (
                    <ProductCard key={product.productDetails._id} product={product.productDetails} />
                ))
            )}
        </div>
    );
};

export default SupplierProducts;