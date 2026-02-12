const axios = require('axios');

const PAYMOB_API_URL = 'https://egypt.paymob.com/api';

const paymobService = {
    /**
     * 1. Authenticate with Paymob to get an access token
     */
    getAuthToken: async () => {
        try {
            const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
                api_key: process.env.API_PAYMOP_KEY
            });
            return response.data.token;
        } catch (error) {
            console.error('Paymob Auth Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Paymob');
        }
    },

    /**
     * 2. Register an order on Paymob
     */
    registerOrder: async (authToken, orderData) => {
        try {
            const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
                auth_token: authToken,
                delivery_needed: "false",
                amount_cents: Math.round(orderData.totalPrice * 100), // Convert EGP to Cents
                currency: "EGP",
                items: orderData.items.map(item => ({
                    name: item.title,
                    amount_cents: Math.round(item.price * 100),
                    description: item.size,
                    quantity: item.quantity
                }))
            });
            return response.data.id; // This is the Paymob Order ID
        } catch (error) {
            console.error('Paymob Order Registration Error:', error.response?.data || error.message);
            throw new Error('Failed to register order with Paymob');
        }
    },

    /**
     * 3. Get Payment Key (Token for Iframe)
     */
    getPaymentKey: async (authToken, paymobOrderId, orderData) => {
        try {
            const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
                auth_token: authToken,
                amount_cents: Math.round(orderData.totalPrice * 100),
                expiration: 3600, // 1 hour
                order_id: paymobOrderId,
                billing_data: {
                    apartment: "NA",
                    email: "customer@example.com", // You might want to get this from user
                    floor: "NA",
                    first_name: "Customer",
                    street: "NA",
                    building: "NA",
                    phone_number: "+201234567890",
                    shipping_method: "NA",
                    postal_code: "NA",
                    city: "NA",
                    country: "EG",
                    last_name: "NA",
                    state: "NA"
                },
                currency: "EGP",
                integration_id: process.env.INTIGRATION_ID,
                lock_order_when_paid: "false"
            });
            return response.data.token;
        } catch (error) {
            console.error('Paymob Payment Key Error:', error.response?.data || error.message);
            throw new Error('Failed to generate payment key');
        }
    }
};

module.exports = paymobService;
