// Email for suppliers
function generateSupplierEmailBody(supplierName, products, user, shippingMethod, shippingAddress, phoneNumber, invoiceType, vatNumber, paymentMethod, discount = 0, supplierTotal, commission) {
    let totalAmount = 0;

    // Generate product list and calculate total amount
    let productListText = `
    <ul style="list-style-type: none; padding: 0; margin: 0;">
`;

    products.forEach(product => {
        const productTotal = product.quantity * product.productSupplier.price;
        totalAmount += productTotal;

        productListText += `
        <li style="margin-bottom: 10px;">
            <div>
                <strong>${product.productSupplier.product.name}</strong><br>
                - Quantity: ${product.quantity}<br>
                - €${product.productSupplier.price.toFixed(2)} each<br>
                - Total: €${productTotal.toFixed(2)}
            </div>
        </li>
    `;
    });

    productListText += `
    </ul>
`;

    // Apply discount
    const discountedTotal = discount > 0 ? totalAmount - (totalAmount * discount / 100) : totalAmount;

    let shippingMethodText = '';
    if (shippingMethod === 'Store Pickup') {
        shippingMethodText = `<p>Shipping Method: <strong>Store Pickup</strong> (No delivery required).</p>`;
    } else {
        shippingMethodText = `<p>Shipping Method: <strong>${shippingMethod}</strong></p>`;
    }

    // Format the shipping address
    const formattedAddress = shippingAddress
        ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postalCode}`
        : 'No delivery address provided';

    return `
    <html>
        <body>
            <h2>Dear ${supplierName},</h2>
            <p>You have received a new order from a business partner. Please prepare the following items:</p>
                ${productListText}
            <p><strong>Total Value of Products:</strong> €${discountedTotal.toFixed(2)}</p>
            ${shippingMethodText}
            <hr />

            <h3>Customer Contact Details</h3>
            <p><strong>Name:</strong> ${user.fullName}</p>
            <p><strong>Business Name:</strong>
            ${user.businessName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber?.number || 'Not provided'}</p>
            <p><strong>Address:</strong> ${formattedAddress}</p>
            <hr />

            <h3>Invoice and Payment Details</h3>
            <p><strong>Invoice Type:</strong> ${invoiceType === 'business' ? 'Business' : 'Individual'}</p>
            ${invoiceType === 'business' ? `<p><strong>VAT Number:</strong> ${vatNumber || 'Not provided'}</p>` : ''}
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <hr />

            <h3>Earnings</h3>
            <p><strong>Total:</strong> €${supplierTotal.toFixed(2)}</p>
            <p><strong>Commission:</strong> €${commission.toFixed(2)}</p>
            <br />

            <p>Please confirm receipt of this email and notify us if you require any further information to complete the order.</p>
            <br />
            <p>Best regards,</p>
            <p>ProcureWise</p>
        </body>
    </html>
    `;
}

// Order Confirmation Email
function generateOrderConfirmation(firstName, lastName, orderId, groupedProducts, totalAmount) {
    let productRows = '';

    groupedProducts.forEach(group => {
        productRows += `
            <tr style="background: #f4f4f4;">
                <td colspan="3" style="padding: 10px; font-weight: bold; text-align: left;">Supplier: ${group.supplier.name}</td>
            </tr>
        `;

        group.products.forEach(orderProduct => {
            productRows += `
                <tr>
                    <td style="padding: 10px;">
                        <img src="${orderProduct.productSupplier.product.imageUrl}" alt="${orderProduct.productSupplier.product.name}" width="100" height="100" style="border-radius: 5px;">
                    </td>
                    <td style="padding: 10px;">${orderProduct.productSupplier.product.name}</td>
                    <td style="padding: 10px;">${orderProduct.quantity}</td>
                    <td style="padding: 10px;">€${(orderProduct.priceAtOrderTime * orderProduct.quantity).toFixed(2)}</td>
                </tr>
            `;
        });
    });

    return `
    <html>
        <body>
            <h1>Order Confirmation</h1>
            <p>Dear ${firstName} ${lastName},</p>
            <p>Your order with ID <strong>${orderId}</strong> has been placed successfully!</p>

            <h3>Order Details:</h3>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th style="text-align: left; background: #ddd; padding: 10px;"></th>
                        <th style="text-align: left; background: #ddd; padding: 10px;">Product</th>
                        <th style="text-align: left; background: #ddd; padding: 10px;">Quantity</th>
                        <th style="text-align: left; background: #ddd; padding: 10px;">Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${productRows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold; padding: 10px; background: #eee;">Total Amount:</td>
                        <td style="font-weight: bold; padding: 10px; background: #eee;">€${totalAmount.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <p>We are processing your order and will notify you once it's on its way.</p>
            <p>If you have any questions, feel free to reach out to us!</p>
            <p>Best regards,<br>ProcureWise</p>
        </body>
    </html>
    `;
}

// Email verification
const generateVerificationEmail = (user, verificationToken) => {
    const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;


    return {
        subject: 'Verify Your Email - Complete Your Registration',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #fc814a; text-align: center;">Welcome, ${user.firstName}!</h2>
                <p>Thank you for registering on our platform. To complete your registration, please verify your email address.</p>
                <p>Click the button below to verify your email:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${verificationLink}" 
                       style="background-color: #fc814a; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p>If you did not create this account, you can ignore this email.</p>
                <p>Best regards,<br>ProcureWise</p>
            </div>
        `
    };
}

module.exports = { generateSupplierEmailBody, generateOrderConfirmation, generateVerificationEmail }