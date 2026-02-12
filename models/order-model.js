const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({

  orderNumber: {
    type: Number,
    required: true
  },

  items: [
    {
      drinkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drink',
        required: true
      },

      title: {
        type: String,
        required: true
      },

      size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        required: true
      },

      price: {
        type: Number,
        required: true
      },

      customizations: {
        sugar: {
          type: String,
          enum: ['no_sugar', '1_shot', '2_shots', '3_shots'],
          default: 'no_sugar'
        },

        spiced: {
          type: Boolean,
          default: false
        }
      },

      quantity: {
        type: Number,
        default: 1
      }
    }
  ],

  totalPrice: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['waiting_for_cash', 'paid', 'pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },

  paymentMethod: {
    type: String,
    enum: ['vodafone_cash', 'instapay', 'card', 'cash', 'wallet'],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid'
  },



  notes: {
    type: String
  },

  paymobOrderId: {
    type: String,
    sparse: true
  },

  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }

}, {
  timestamps: true
})

module.exports = mongoose.model('Order', OrderSchema)
