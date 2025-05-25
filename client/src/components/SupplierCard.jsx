import FavoriteButton from './FavoriteButton';
import Rating from '../components/Rating';

// Redirect to supplier's page
const handleView = (supplierId) => {
    window.location.href = `/suppliers/${supplierId}`;
}

const SupplierCard = ({ supplier }) => {
    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 w-[200px] h-[200px] relative">
            <div className="p-2 h-3/5 overflow-hidden flex items-center justify-center">
                <img
                    src={supplier.logo || "https://via.placeholder.com/50"}
                    alt={`${supplier.name} logo`}
                    className="w-3/5 hover:cursor-pointer"
                    onClick={() => handleView(supplier.supplierId)}
                />
                <div className="absolute top-1 right-1 rounded-full bg-white p-2">
                    <FavoriteButton typeId={supplier._id} type="Supplier" size="small" />
                </div>
            </div>
            <div className="flex flex-col items-center">
                <h3 className="font-medium hover:cursor-pointer text-center"
                    onClick={() => handleView(supplier.supplierId)}
                >
                    {supplier.name}
                </h3>
                <div>
                    <Rating itemId={supplier._id} itemType='supplier' />
                </div>
            </div>
        </div>
    );
};

export default SupplierCard;
