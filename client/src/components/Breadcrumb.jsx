import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = () => {
    const location = useLocation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/categories/get/hierarchy');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const buildBreadcrumbPath = (slug) => {
        const breadcrumb = [];
        const categoryMap = categories.reduce((map, category) => {
            map[category.slug] = category;
            return map;
        }, {});

        let currentSlug = slug;

        // Iterate back through the categories using parentSlug
        while (currentSlug) {
            const currentCategory = categoryMap[currentSlug];

            if (!currentCategory) break;

            breadcrumb.unshift({
                slug: currentCategory.slug,
                label: currentCategory.name,
            });

            currentSlug = currentCategory.parentSlug;
        }

        return breadcrumb;
    }

    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbPath = buildBreadcrumbPath(pathnames[pathnames.length - 1]);

    if (loading) return null;

    return (
        <nav aria-label="breadcrumb">
            <ol className="flex items-center text-sm space-x-2 mb-2">
                <li>
                    <Link to="/" className="text-gray-500 hover:text-gray-800">
                        Home
                    </Link>
                </li>
                <li className="flex items-center space-x-2">
                    <span>/</span>
                    <Link to="/categories" className="text-gray-500 hover:text-gray-800">
                        Categories
                    </Link>
                </li>
                {breadcrumbPath.map((crumb, index) => {
                    const to = `/categories/${crumb.slug}`;
                    const isLast = index === breadcrumbPath.length - 1;
                    return (
                        <li key={to} className="flex items-center space-x-2">
                            <span>/</span>
                            {isLast ? (
                                <span className="text-gray-800">{crumb.label}
                                </span>
                            ) : (
                                <Link to={to} className="text-gray-500 hover:text-gray-800">
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;