require('dotenv').config();
const axios = require('axios');

async function test() {
    console.log("Testing Paymob Auth...");
    console.log("API_PAYMOP_KEY length:", process.env.API_PAYMOP_KEY?.length);

    try {
        const response = await axios.post('https://egypt.paymob.com/api/auth/tokens', {
            api_key: process.env.API_PAYMOP_KEY
        });
        console.log("Auth Success! Token received.");

        const authToken = response.data.token;
        console.log("Testing Order Registration...");

        const orderResponse = await axios.post('https://egypt.paymob.com/api/ecommerce/orders', {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: 1000,
            currency: "EGP",
            items: [{ name: "Test Item", amount_cents: 1000, quantity: 1 }]
        });
        console.log("Order Registration Success! ID:", orderResponse.data.id);

    } catch (error) {
        console.error("Test Failed!");
        console.error("Error Response:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
}

test();
