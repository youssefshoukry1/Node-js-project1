require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const drink = require('../Routes/Drink-route');
const order = require('../Routes/order-route');

const app = express();

app.use(express.json());
app.use(cors());

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URL);
  isConnected = true;
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/drink', drink);
app.use('/api/order', order);

module.exports = app;
