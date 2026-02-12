const axios = require('axios');

// Paymob API Base URL (Egypt)
const PAYMOB_API_URL = 'https://egypt.paymob.com/api';

/**
 * Paymob Payment Gateway Service
 * 
 * How it works:
 * 1. Get authentication token from Paymob
 * 2. Register the order with Paymob
 * 3. Generate a payment token for the customer
 * 4. Redirect customer to Paymob's payment page
 */
const paymobService = {

    /**
     * STEP 1: Authenticate with Paymob
     * Returns: Authentication token to use in next steps
     */
    getAuthToken: async () => {
        try {
            const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
                api_key: process.env.API_PAYMOP_KEY
            });

            return response.data.token;

        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            console.error('❌ Paymob Authentication Failed:', errorDetails);
            throw new Error(`Paymob auth failed: ${JSON.stringify(errorDetails)}`);
        }
    },

    /**
     * STEP 2: Register Order with Paymob
     * Returns: Paymob Order ID
     */
    registerOrder: async (authToken, orderData) => {
        try {
            const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
                auth_token: authToken,
                delivery_needed: false,
                amount_cents: Math.round(orderData.totalPrice * 100), // Convert EGP to cents
                currency: "EGP",
                items: orderData.items.map(item => ({
                    name: item.title,
                    amount_cents: Math.round(item.price * 100),
                    description: item.size,
                    quantity: item.quantity
                }))
            });

            return response.data.id;

        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            console.error('❌ Paymob Order Registration Failed:', errorDetails);
            throw new Error(`Paymob order registration failed: ${JSON.stringify(errorDetails)}`);
        }
    },

    /**
     * STEP 3: Generate Payment Token
     * This token is used to create the payment page URL
     * Returns: Payment token
     */
    getPaymentKey: async (authToken, paymobOrderId, orderData) => {
        try {
            const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
                auth_token: authToken,
                amount_cents: Math.round(orderData.totalPrice * 100),
                expiration: 3600, // Token valid for 1 hour
                order_id: paymobOrderId,

                // Customer billing information (required by Paymob)
                billing_data: {
                    first_name: "Customer",
                    last_name: "User",
                    email: "test@example.com",
                    phone_number: "01012345678",

                    // Address fields
                    apartment: "1",
                    floor: "1",
                    street: "Main St",
                    building: "10",
                    city: "Cairo",
                    state: "Cairo",
                    country: "EG",
                    postal_code: "11511",
                    shipping_method: "NA"
                },

                currency: "EGP",
                integration_id: Number(process.env.INTIGRATION_ID), // Your Paymob integration ID
                lock_order_when_paid: false
            });

            return response.data.token;

        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            console.error('❌ Paymob Payment Key Generation Failed:', errorDetails);
            throw new Error(`Paymob payment key failed: ${JSON.stringify(errorDetails)}`);
        }
    }
};

module.exports = paymobService;
