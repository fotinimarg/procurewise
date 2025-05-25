import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import CartContext from "../../../context/CartContext";
import UserContext from "../../../context/userContext";
import { Link, useNavigate } from "react-router-dom";
import { LiaLongArrowAltLeftSolid } from "react-icons/lia";
import toast from "react-hot-toast";
import CustomRadio from "../../components/CustomRadio";
import RegionSelect from "../../components/RegionSelect";

const Checkout = () => {
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', postalCode: '' });
    const [addingNewAddress, setAddingNewAddress] = useState(false);
    const [newNumber, setNewNumber] = useState({ number: '' })
    const [addingPhoneNumber, setAddingPhoneNumber] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [invoiceType, setInvoiceType] = useState("Individual");
    const { cart, fetchCart, setCart } = useContext(CartContext);
    const [loading, setLoading] = useState(true);
    const { user, setUser } = useContext(UserContext);
    const [vatNumber, setVatNumber] = useState(user?.vatNumber || "");
    const [businessName, setBusinessName] = useState(user?.businessName || "");
    const isPostalCodeValid = (postalCode) => /^\d{5}$/.test(postalCode);
    const [postalCodeError, setPostalCodeError] = useState('');
    const isPhoneValid = (number) => /^\d{10}$/.test(number);
    const [phoneNumberError, setPhoneNumberError] = useState('');
    const navigate = useNavigate();
    const [shippingMethod, setShippingMethod] = useState("");
    const [vatError, setVatError] = useState('');
    const isVatValid = (vat) => /^\d{9}$/.test(vat);

    useEffect(() => {
        const loadCart = async () => {
            await fetchCart();
            if (!cart || cart?.groupedProducts?.length === 0) {
                navigate('/cart');
            }
            setLoading(false);
        };

        loadCart();
    }, []);

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const response = await axios.get('/user/address');
                setAddresses(response.data);
            } catch (error) {
                console.log('Error fetching addresses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAddress();
    }, [addingNewAddress]);

    useEffect(() => {
        const fetchNumber = async () => {
            try {
                const response = await axios.get('/user/phone-number');
                setPhoneNumbers(response.data)
            } catch (error) {
                console.log('Error fetching phone numbers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNumber();
    }, [addingPhoneNumber]);

    useEffect(() => {
        const defaultShipping = async () => {
            // Set the primary address as the default selected address
            const primaryAddress = addresses.find((address) => address.isPrimary);
            if (primaryAddress) {
                setSelectedAddress(primaryAddress._id);
                setShippingMethod("Delivery");

                let shippingCost = 0;

                // Determine shipping cost based on the selected shipping method
                const uniqueSuppliers = new Set(cart?.groupedProducts.map(group => group.supplier._id));
                shippingCost = uniqueSuppliers.size * 3; // 3 euros per supplier

                try {
                    const response = await axios.put('/order/shipping', {
                        orderId: cart._id,
                        shippingMethod: "Delivery",
                        shippingCost: shippingCost,
                        shippingAddressId: primaryAddress._id
                    });

                    if (response.status === 200) {
                        setCart(prevCart => ({
                            ...prevCart,
                            subtotal: response.data.subtotal,
                            totalAmount: response.data.totalAmount,
                            shippingCost: shippingCost,
                            shippingMethod: "Delivery",
                            shippingAddressId: primaryAddress._id
                        }));
                    }
                } catch (error) {
                    console.error('Error updating shipping method:', error);
                }
            }
        }
        defaultShipping();
    }, [addresses])

    useEffect(() => {
        const defaultNumber = async () => {
            const defaultNumber = phoneNumbers[0];
            if (defaultNumber) {
                setSelectedNumber(defaultNumber._id);

                try {
                    const response = await axios.put('/order/contact', {
                        orderId: cart._id,
                        contact: defaultNumber._id
                    });

                    if (response.status === 200) {
                        setCart(prevCart => ({
                            ...prevCart,
                            contact: defaultNumber._id
                        }));
                    }
                } catch (error) {
                    console.error('Error updating contact info:', error);
                }
            }
        }
        defaultNumber();
    }, [phoneNumbers]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'postalCode' && !isPostalCodeValid(value)) {
            setPostalCodeError('Postal code must be exactly 5 digits.');
        } else {
            setPostalCodeError('');
        }

        setNewAddress((prev) => ({ ...prev, [name]: value }));
    }

    const handleNumberChange = (e) => {
        const { value } = e.target;
        if (!isPhoneValid(value)) {
            setPhoneNumberError('Phone number must be exactly 10 digits.');
        } else {
            setPhoneNumberError('');
        }

        setNewNumber({ number: value });
    }

    const handleVatChange = (e) => {
        const { value } = e.target;
        if (!isVatValid(value)) {
            setVatError('VAT number must be exactly 9 digits.');
        } else {
            setVatError('');
        }

        setVatNumber(value);
    }

    const handleAddNewAddress = async () => {
        if (postalCodeError || !isPostalCodeValid(newAddress.postalCode)) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            const { data } = await axios.post("/user/address", { address: newAddress });

            if (data && data.address) {
                setAddresses([...addresses, data.address]);
            } else {
                console.log('Failed to retrieve address from response.')
            }

            setNewAddress({ street: '', city: '', postalCode: '' });
            setAddingNewAddress(false);

            setUser((prevUser) => ({
                ...prevUser,
                address: data.address
            }));
        } catch (error) {
            console.error("Error adding new address:", error);
        }
    }

    const handleAddPhoneNumber = async () => {
        if (phoneNumberError || !isPhoneValid(newNumber.number)) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            const { data } = await axios.post("/user/phone-number", { phoneNumber: newNumber.number });

            if (data && data.phoneNumber) {
                setPhoneNumbers([...phoneNumbers, data.phoneNumber]);
            } else {
                console.log('Failed to retrieve phone number from response.')
            }

            setNewNumber({ street: '', city: '', postalCode: '' });
            setAddingPhoneNumber(false);

            setUser((prevUser) => ({
                ...prevUser,
                phoneNumber: data.phoneNumber
            }));
        } catch (error) {
            console.error("Error adding new phone number:", error);
        }
    }

    const handleContact = async () => {
        try {
            const response = await axios.put('/order/contact', {
                orderId: cart._id,
                contact: selectedNumber
            });

            if (response.status === 200) {
                setCart(prevCart => ({
                    ...prevCart,
                    contact: selectedNumber
                }));
            }
        } catch (error) {
            console.error('Error updating contact info:', error);
        }
    }

    const handleShippingChange = async (method) => {
        let shippingCost = 0;

        // Determine shipping cost based on the selected shipping method
        if (method === "Delivery") {
            const uniqueSuppliers = new Set(cart?.groupedProducts.map(group => group.supplier._id));
            shippingCost = uniqueSuppliers.size * 3; // 3 euros per supplier
        } else if (method === "Store Pickup") {
            shippingCost = 0;
        }

        try {
            const response = await axios.put('/order/shipping', {
                orderId: cart._id,
                shippingMethod: method,
                shippingCost: shippingCost,
                shippingAddressId: selectedAddress
            });

            if (response.status === 200) {
                setCart(prevCart => ({
                    ...prevCart,
                    subtotal: response.data.subtotal,
                    totalAmount: response.data.totalAmount,
                    shippingCost: shippingCost,
                    shippingMethod: method,
                    shippingAddressId: selectedAddress
                }));
            }
        } catch (error) {
            console.error('Error updating shipping method:', error);
        }
    }

    const handleAddVat = async () => {
        if (vatError) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        try {
            const response = await axios.put("/order/vat-number", { orderId: cart._id, vatNumber, userId: user._id });

            if (response.status === 200) {
                setCart(prevCart => ({
                    ...prevCart,
                    vatNumber: vatNumber
                }));
                setUser(prevUser => ({
                    ...prevUser,
                    vatNumber
                }));

                const userUpdateResponse = await axios.put("/user/update", {
                    businessName
                });

                if (userUpdateResponse.status === 200) {
                    setUser(prevUser => ({
                        ...prevUser,
                        businessName
                    }));
                }
                toast.success('Successfully added VAT number and updated business name!')
            }

        } catch (error) {
            console.error("Error updating VAT number:", error);
        }
    }

    const handleProceed = async () => {
        if (!shippingMethod) {
            toast.error("Please select a shipping method.");
            return;
        }

        if (shippingMethod === 'Delivery' && !selectedAddress) {
            toast.error("Please select an address.");
            return;
        }

        if (!selectedNumber) {
            toast.error("Please select or add a phone number.");
            return;
        }

        if (!invoiceType) {
            toast.error("Please select invoice type.");
            return;
        }
        if (invoiceType === 'Business') {
            if (!vatNumber.trim()) {
                toast.error("Please enter your VAT number to proceed.");
                return;
            }
            if (!user.businessName) {
                toast.error("Please enter your business name to proceed.");
                return;
            }
        }

        navigate('/checkout/payment');
    }

    if (loading) return <div>Loading...</div>;
    if (!cart) navigate(-1);

    return (
        <div className="max-w-screen-xl mx-auto p-6">
            <div className="flex justify-between pr-3 items-center">
                <h1 className="text-2xl font-bold mb-4">Checkout</h1>
                <Link to={'/cart'} className="flex items-center gap-1 text-[#fc814a] hover:underline">
                    <LiaLongArrowAltLeftSolid size={20} />
                    Back to Cart
                </Link>
            </div>
            <div className="container bg-white shadow-md rounded-xl p-6 flex justify-between gap-5 sm:flex-col lg:flex-row">
                <div className="w-full md:border-r md:pr-5">

                    {/* Type of invoice */}
                    <div className="mb-10 border-b pb-10 w-2/3">
                        <h2 className="text-lg font-semibold mb-4">Type of invoice</h2>
                        <div className="space-y-4">
                            {[
                                { id: 'individual', label: 'Individual' },
                                { id: 'business', label: 'Business' }
                            ].map((invoice) => (
                                <CustomRadio
                                    key={invoice.id}
                                    id={invoice.id}
                                    name="invoiceType"
                                    value={invoice.label}
                                    checked={invoiceType === invoice.label}
                                    onChange={(value) => setInvoiceType(value)}
                                    label={`${invoice.label}`}
                                />
                            ))}
                        </div>

                        {invoiceType === 'Business' && (
                            <div className="my-4">
                                <label htmlFor="vatNumber" className="block text-base">
                                    VAT Number
                                </label>
                                <input
                                    type="text"
                                    id="vatNumber"
                                    name="vatNumber"
                                    value={vatNumber}
                                    maxLength={9}
                                    onChange={handleVatChange}
                                    placeholder="Enter VAT number"
                                    className={`w-full border rounded-xl p-2 mb-2 ${vatError ? 'border-red-500' : 'border'}`}
                                />
                                {vatError && (
                                    <p className="my-1 mb-2 text-red-500 text-sm">{vatError}
                                    </p>
                                )}
                                <label htmlFor="businessName" className="block text-base">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    id="businessName"
                                    name="businessName"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="Enter business name"
                                    className={'w-full border rounded-xl p-2 mb-2'}
                                />

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleAddVat}
                                        disabled={vatError}
                                        className="bg-[#fc814a] text-white py-2 px-4 rounded-xl hover:bg-[#fc5f18] transition-colors duration-300">
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setVatNumber('')}
                                        className="bg-gray-300 py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Address Section */}
                    < div className="mb-10 border-b pb-10 w-2/3" >
                        <h2 className="text-lg font-semibold mb-4">Select an Address</h2>
                        <div className="space-y-4">
                            {addresses.map((address) => (
                                <CustomRadio
                                    key={address._id}
                                    id={address._id}
                                    name="address"
                                    value={address._id}
                                    checked={selectedAddress === address._id}
                                    onChange={() => {
                                        setSelectedAddress(address._id); setShippingMethod("Delivery"); handleShippingChange("Delivery");
                                    }}
                                    label={`${address.street}, ${address.city}, ${address.postalCode}`}
                                />
                            ))}

                            {/* Add New Address */}
                            {addingNewAddress ? (
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        name="street"
                                        value={newAddress.street}
                                        onChange={handleInputChange}
                                        placeholder="Street"
                                        className="w-full p-2 border rounded-xl mb-2"
                                    />
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={newAddress.city}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-xl mb-2"
                                    />
                                    <input
                                        type="text"
                                        name="postalCode"
                                        placeholder="Postal Code"
                                        value={newAddress.postalCode}
                                        onChange={handleInputChange}
                                        maxLength={5}
                                        className={`w-full border rounded-xl p-2 mb-2 ${postalCodeError ? 'border-red-500' : 'border'}`}
                                    />

                                    <RegionSelect value={newAddress.region}
                                        onChange={(selectedNomos) => setNewAddress(prev => ({ ...prev, region: selectedNomos }))} />

                                    {postalCodeError && (
                                        <p className="my-1 mb-2 text-red-500 text-sm">{postalCodeError}</p>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleAddNewAddress}
                                            disabled={postalCodeError}
                                            className="bg-[#fc814a] text-white py-2 px-4 rounded-xl hover:bg-[#fc5f18] transition-colors duration-300"
                                        >
                                            Save Address
                                        </button>
                                        <button
                                            onClick={() => { setAddingNewAddress(false); setNewAddress({ street: '', city: '', postalCode: '' }); setPostalCodeError('') }}
                                            className="bg-gray-300 py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingNewAddress(true)}
                                    className="mt-4 py-2 px-4 rounded-xl bg-[#564256] hover:bg-[#392339] text-white transition-colors duration-300"
                                >
                                    Add New Address
                                </button>
                            )}

                            {/* Store Pickup */}
                            {cart?.groupedProducts?.length === 1 && (
                                <CustomRadio
                                    id="storePickup"
                                    name="shippingMethod"
                                    value="Store Pickup"
                                    checked={shippingMethod === "Store Pickup"}
                                    onChange={(value) => {
                                        setShippingMethod(value);
                                        setSelectedAddress(null);
                                        handleShippingChange(value);
                                    }}
                                    label="Store Pickup"
                                />
                            )}
                        </div>
                    </div>

                    {/* Phone Number Section */}
                    < div className="mb-10 border-b pb-10 w-2/3" >
                        <h2 className="text-lg font-semibold mb-4">Select a Phone Number</h2>
                        <div className="space-y-4">
                            {phoneNumbers.map((number) => (
                                <CustomRadio
                                    key={number._id}
                                    id={number._id}
                                    name="number"
                                    value={number._id}
                                    checked={selectedNumber === number._id}
                                    onChange={() => {
                                        setSelectedNumber(number._id);
                                        handleContact();
                                    }}
                                    label={`${number.number}`}
                                />
                            ))}

                            {/* Add New Phone Number */}
                            {addingPhoneNumber ? (
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        name="number"
                                        value={newNumber.number}
                                        onChange={handleNumberChange}
                                        placeholder="Phone Number"
                                        maxLength={10}
                                        minLength={10}
                                        pattern="\d{10}"
                                        className={`w-full border rounded-xl p-2 mb-2 ${phoneNumberError ? 'border-red-500' : 'border'}`}
                                    />
                                    {phoneNumberError && (
                                        <p className="my-1 mb-2 text-red-500 text-sm">{phoneNumberError}</p>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleAddPhoneNumber}
                                            className="bg-[#fc814a] text-white py-2 px-4 rounded-xl hover:bg-[#fc5f18] transition-colors duration-300"
                                        >
                                            Save Phone Number
                                        </button>
                                        <button
                                            onClick={() => { setAddingPhoneNumber(false), setNewNumber({ number: '' }), setPhoneNumberError('') }}
                                            className="bg-gray-300 py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingPhoneNumber(true)}
                                    className="mt-4 py-2 px-4 rounded-xl bg-[#564256] hover:bg-[#392339] text-white transition-colors duration-300"
                                >
                                    Add New Phone Number
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    {/* Order Summary */}
                    <div className="m-4">
                        <h2 className="text-lg mb-4"><strong>Order Summary</strong></h2>
                        <div>
                            {cart?.groupedProducts.map((group) => (
                                <div key={group.supplier._id} className="mb-4 border-b">
                                    <h2 className="text-base font-bold">
                                        {group.supplier.name}
                                    </h2>
                                    <ul>
                                        {group?.products.map((orderProduct) => (
                                            <li key={orderProduct._id} className="mb-2">
                                                <div className="grid grid-cols-[3fr_1fr_1fr] items-center">
                                                    <p>{orderProduct?.productSupplier?.product.name}
                                                    </p>
                                                    <p className="text-center">
                                                        {orderProduct?.quantity}x
                                                    </p>
                                                    <p className="text-end">
                                                        {new Intl.NumberFormat('el', {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        }).format(orderProduct?.productSupplier?.price)}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <p className="text-end">Subtotal: {new Intl.NumberFormat('el', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(cart?.subtotal)}</p>
                        <p className="text-end mb-4">
                            Shipping Cost: {shippingMethod === "Store Pickup" ? 'Free' : new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(cart?.shippingCost)}
                        </p>
                        <p className="text-end"><strong>Total:</strong> {new Intl.NumberFormat('el', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(cart?.totalAmount)}</p>
                    </div>

                    {/* Place Order Button */}
                    <button
                        onClick={handleProceed}
                        className="w-full py-2 px-6 rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white transition-colors duration-300"
                    >
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Checkout;