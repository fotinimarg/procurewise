import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

const Categories = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <Breadcrumb />
            <h1 className="text-2xl font-semibold mb-4">Categories</h1>
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(250px,1fr))] justify-center">
                {categories.map((category) => (
                    <Link
                        key={category._id}
                        to={
                            `/categories/${category.slug}`
                        }
                        state={{ categoryId: category._id }}
                        className="relative">
                        <div className="bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow duration-300 max-w-sm text-gray-900 font-semibold text-xl text-center">
                            <div className="relative w-full h-48 group">
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-75 transition-opacity duration-300 group-hover:opacity-80"
                                />
                                <div className="absolute inset-0 bg-black opacity-30 rounded-xl transition-opacity duration-300 group-hover:opacity-50"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-semibold z-10">
                                    {category.name}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Categories;