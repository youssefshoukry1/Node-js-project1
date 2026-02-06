const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: { // A short code/ID for easier selection/URL params if needed
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Institution', InstitutionSchema);
