import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { createGlobalStyle } from 'styled-components';
import 'swiper/css';
import 'swiper/css/navigation';
import SupplierCard from './SupplierCard';

const GlobalStyle = createGlobalStyle`
  .swiper-button-prev, .swiper-button-next {
    color: #fc814a;
    padding: 10px;
    z-index: 10;
  }
  .swiper-button-prev:hover, .swiper-button-next:hover {
    color: #ff9e6b;
  }
`;

const SupplierCarousel = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [swiperKey, setSwiperKey] = useState(0);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get('/suppliers', { params: { limit: 10, sort: 'rating' } });
                setSuppliers(response.data.suppliers);
                setSwiperKey((prevKey) => prevKey + 1);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        };
        fetchSuppliers();
    }, []);

    return (
        <>
            <GlobalStyle />
            <div className="supplier-carousel">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Our Top Suppliers</h2>
                {suppliers.length > 0 && (
                    <Swiper
                        key={swiperKey}
                        modules={[Navigation, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={5}
                        loop={true}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                        }}
                        navigation={true}
                        breakpoints={{
                            1024: { slidesPerView: 5 },
                            768: { slidesPerView: 3 },
                            480: { slidesPerView: 2 },
                        }}
                        style={{
                            paddingLeft: '30px',
                            paddingRight: '20px',
                        }}
                    >
                        {suppliers.map((supplier) => (
                            <SwiperSlide key={supplier._id} className="pb-4">
                                <SupplierCard supplier={supplier} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
                <div className="text-right">
                    <button
                        onClick={() => (window.location.href = '/suppliers')}
                        className="text-[#fc814a] hover:underline"
                    >
                        View All Suppliers →
                    </button>
                </div>
            </div>
        </>
    );
};

export default SupplierCarousel;
