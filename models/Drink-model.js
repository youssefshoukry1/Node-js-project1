const mongoose = require('mongoose')

const DrinkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    coffeeType: {
        type: String,
        enum: [
            'espresso',
            'cappuccino',
            'coffee',
            'tea'
        ],
        required: true
    },

    sizes: [
        {
            size: {
                type: String,
                enum: ['small', 'medium', 'large'],
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],

    options: {
        sugar: {
            type: Boolean,
            default: true
        },
        spiced: {
            type: Boolean,
            default: false
        }
    },

    image: {
        type: String,
        required: true
    },

    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Drink', DrinkSchema)
