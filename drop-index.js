const mongoose = require('mongoose');
require('dotenv').config(); // Load env vars if needed, but I might need to harcode or pass it if .env is in root

// Adjust path to your .env file location if necessary, or just hardcode for this fix if you know it.
// Assuming the app runs with process.env.MONGO_URL available or loaded from .env in root.

const url = "mongodb+srv://yousef:yousef@cluster0.56j8j.mongodb.net/ElBon?retryWrites=true&w=majority&appName=Cluster0";
// I recalled the URL from previous context or I should check api/index.js or just ask user? 
// Wait, I don't see the full mongo url in the specific file view I did earlier (it was process.env.MONGO_URL).
// I will try to read .env file first to get the string, or use the one from the error message "ElBon" db.
// Actually, better to just modify api/index.js temporarily to drop index on startup, then revert.
// OR, create a script that uses the existing connection logic.

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || "mongodb+srv://yousef:yousef@cluster0.56j8j.mongodb.net/ElBon?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to DB');

        const Order = require('../models/order-model');

        try {
            await Order.collection.dropIndex('orderNumber_1');
            console.log('Successfully dropped index: orderNumber_1');
        } catch (e) {
            console.log('Index drop failed (maybe it does not exist):', e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
