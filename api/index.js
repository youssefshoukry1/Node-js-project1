require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const url = process.env.MONGO_URL;
const drink = require('../Routes/Drink-route')
const order = require('../Routes/order-route')

// ================= Middleware =================
app.use(express.json());
app.use(cors());
// ================= DB =================
mongoose.connect(url)
  .then(() => console.log('MongoDB started'))
  .catch(err => console.log('MongoDB connection error:', err));

// ================= Routes =================
app.use('/api/drink',drink)
app.use('/api/order',order)
// ================= Server =================
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
