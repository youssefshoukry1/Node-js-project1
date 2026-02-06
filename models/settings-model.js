const mongoose = require('mongoose')

const SettingsSchema = new mongoose.Schema({
    // Singleton ID to ensure only one document
    _id: { type: String, default: 'ALIGNMENT_SETTINGS' },

    adminPassword: {
        type: String,
        default: '1234' // Default for initial setup
    },

    ownerPassword: {
        type: String,
        default: '0000' // Default owner password
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Settings', SettingsSchema)
