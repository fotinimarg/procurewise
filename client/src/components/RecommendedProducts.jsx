import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import ProductCard from './ProductCard';

const RecommendedProducts = ({ recommendedProducts }) => {
    return (
        <>
            {recommendedProducts.length > 0 && (
                <div className="recommended-carousel max-w-screen-xl mt-10">
                    <Swiper
                        slidesPerView={5}
                        loop={true}
                        autoplay={{
                            delay: 3000,
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
                        {recommendedProducts.map((product) => (
                            <SwiperSlide key={product._id} className="pb-6">
                                <ProductCard product={product} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            )}
        </>
    );
};

export default RecommendedProducts;