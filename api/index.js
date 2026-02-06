require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const drink = require('../Routes/Drink-route');
const order = require('../Routes/order-route');
const { initSettings } = require('../Controlls/settings');

const app = express();

app.use(express.json());
app.use(cors());

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URL);

  try {
    // FIX: Remove old unique constraint from DB
    await mongoose.connection.collection('orders').dropIndex('orderNumber_1');
    console.log('Dropped legacy unique index on orderNumber');
  } catch (e) {
    // Index likely already gone or doesn't exist
  }

  isConnected = true;
  await initSettings();
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/drink', drink);
app.use('/api/order', order);
app.use('/api/institution', require('../Routes/institution-route'));

// Settings Route
const router = express.Router();
const { verifyPassword, updatePasswords } = require('../Controlls/settings');
router.post('/verify', verifyPassword);
router.put('/update', updatePasswords);
app.use('/api/settings', router);

module.exports = app;
