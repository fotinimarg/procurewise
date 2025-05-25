import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        onPageChange(newPage);
    };

    return (
        <div className="pagination flex justify-center gap-8 mt-6">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='hover:text-[#fc814a]'
            >
                <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
                <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={currentPage === index + 1 ? 'text-[#fc814a]' : 'hover:text-[#fc814a]'}
                >
                    {index + 1}
                </button>
            ))}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='hover:text-[#fc814a]'
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default Pagination;
