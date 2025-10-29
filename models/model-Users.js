const mongoose = require('mongoose');
const validator = require('validator');
const userRole = require('../Utility/user_roles');
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, 'invalid email']
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    role: {
        type: String,
        enum: [userRole.USER, userRole.ADMIN, userRole.MANEGER],
        default: userRole.USER
    },
    avatar: {
        type: String,
        default: 'uploads/test.png'
    }

})

module.exports = mongoose.model('User', userSchema);