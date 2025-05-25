const updateOrderStatus = async (orderId, newStatus) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status === 'completed') {
            throw new Error('Order is already completed');
        }

        // Only allow transitions to the next step
        const statusOrder = ['cart', 'ordered', 'reviewed', 'shipped', 'completed'];
        const currentIndex = statusOrder.indexOf(order.status);
        const nextIndex = statusOrder.indexOf(newStatus);

        if (nextIndex <= currentIndex) {
            throw new Error('Invalid status transition');
        }

        order.status = newStatus;
        await order.save();

        return order;
    } catch (error) {
        console.error('Error updating order status:', error.message);
        throw new Error('Failed to update order status');
    }
}
