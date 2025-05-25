import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import ProductCard from './ProductCard';

const TopSellingCarousel = ({ categoryId, limit = 10, title = 'Top Selling Products' }) => {
    const [topSellingProducts, setTopSellingProducts] = useState([]);

    useEffect(() => {
        const fetchTopSellingProducts = async () => {
            try {
                const response = await axios.get(`/products/top-picks`, {
                    params: {
                        category: categoryId || null,
                        limit,
                    },
                })
                setTopSellingProducts(response.data);
            } catch (error) {
                console.error('Error fetching top-selling products:', error);
            }
        }

        fetchTopSellingProducts();
    }, [categoryId, limit]);

    return (
        <>
            {topSellingProducts.length > 0 && (
                <div className="top-selling-carousel">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>

                    <Swiper
                        spaceBetween={20}
                        slidesPerView={5}
                        loop={true}
                        autoplay={{
                            delay: 2500,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            1024: {
                                slidesPerView: 5,
                            },
                            768: {
                                slidesPerView: 3,
                            },
                            480: {
                                slidesPerView: 2,
                            },
                        }}
                    >
                        {topSellingProducts.map((product) => (
                            <SwiperSlide key={product._id}
                                className='pb-6'>
                                <ProductCard product={product} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            )}
        </>
    )
}

export default TopSellingCarousel;