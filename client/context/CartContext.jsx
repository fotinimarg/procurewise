import axios from 'axios';
import { createContext, useState } from 'react';

const CartContext = createContext({});

export const CartContextProvider = ({ children }) => {
    const [cart, setCart] = useState(null);

    const fetchCart = async () => {
        try {
            const response = await axios.get('/cart');
            setCart(response.data);
        } catch (err) {
            console.log("Failed to load cart.");
        }
    }

    return (
        <CartContext.Provider value={{ cart, setCart, fetchCart }}>
            {children}
        </CartContext.Provider>
    )
}

export default CartContext;