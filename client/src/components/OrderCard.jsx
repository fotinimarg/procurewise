const OrderCard = ({ order, onViewOrder, onReorder, isCompleted }) => {
    return (
        <div className="bg-white shadow-md rounded-xl p-6 max-w-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Order ID: {order.orderId}</h3>
                    <p className="text-gray-500 text-sm">
                        Date: {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                    {(order.status !== 'cart' && order.status !== 'completed') && (
                        <p className="text-gray-500 text-sm font-semibold">
                            Status: {order.status}
                        </p>
                    )}
                </div>
                <p className="text-lg font-bold text-[#fc814a]">€{order.totalAmount.toFixed(2)}</p>
            </div>
            <div className="mb-4">
                <h4 className="font-semibold mb-2">Products:</h4>
                <ul className="flex flex-col gap-1">
                    {order?.groupedProducts.flatMap((group) =>
                        group?.products.slice(0, 4).map((orderProduct) => (
                            <li
                                key={orderProduct._id}
                                className="flex gap-3 bg-gray-100 rounded-lg p-2"
                            >
                                <img
                                    src={orderProduct.productSupplier.product.imageUrl}
                                    alt={orderProduct.productSupplier.product.name}
                                    className="w-12 h-12 rounded-md object-cover"
                                />
                                <div>
                                    <p className="text-sm text-wrap font-medium">{orderProduct.productSupplier.product.name}</p>
                                    <p className="text-sm">
                                        {orderProduct?.quantity} x {new Intl.NumberFormat('el', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        }).format(orderProduct?.productSupplier?.price)}
                                    </p>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            <div className="flex justify-between">
                <button
                    className="bg-[#fc814a] text-white rounded-xl hover:bg-[#fc5f18] px-4 py-2 transition duration-300"
                    onClick={() => onViewOrder(order.orderId)}
                >
                    View Order
                </button>
                {isCompleted && (
                    <button
                        className="bg-[#564256] text-white rounded-xl hover:bg-[#392339] px-4 py-2 transition duration-300"
                        onClick={() => onReorder(order._id)}
                    >
                        Reorder
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrderCard;
