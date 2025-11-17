const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/model-Users')
const bcrypt = require('bcryptjs');
const generate_jwt = require('../Utility/generate_jwt');


const getAllUsers = async (req, res) => {
    const query = req.query;
    console.log(query);

    const limit = parseInt(query.limit) || 10
    const page = parseInt(query.page) || 1

    const skip = (page - 1) * limit
    //get all courses from database using mongoose
    try {
        const users = await User.find({}, { "__v": false, "password": false }).limit(limit).skip(skip)
        return res.json(users)
    } catch (err) {
        return res.status(404).json({ msg: ' not found' })
    }
}
const deleteUserID = async (req, res) => {
    const userId = req.params.userId;
    try {
        const DeleteUser = await User.deleteOne({ _id: userId })
        return res.status(200).json(DeleteUser)
    } catch (err) {
        return res.status(400).json({ msg: 'cant delete the user' })
    }
}

const Register = async (req, res) => {
    console.log(req.body);
    const { firstName, lastName, email, password, role } = req.body;
    const oldUser = await User.findOne({ email: email })
    if (oldUser) {
        return res.status(409).json({ msg: "User Already Exist. Please Login" })
    }
    //password hashing
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role
    });
    await newUser.save()
    //generate jwt token
    const token = await generate_jwt({ email: newUser.email, id: newUser._id, role: newUser.role })
    newUser.token = token
    res.status(201).json({ message: "user registered successfully", user: newUser, token })
}

const Login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'You should enter email and password' })
    }
    const user = await User.findOne({ email: email })
    if (!user) {
        return res.status(404).json({ message: 'User not found' })
    }
    const matchPassword = await bcrypt.compare(password, user.password)
    if (!matchPassword) {
        return res.status(400).json({ message: 'Invalid credentials' })
    }
    if (user && matchPassword) {
        //logged in successfully
        const token = await generate_jwt({ email: user.email, id: user._id, role: user.role })
        res.status(201).json({ message: "user login successfully", user: user, token })
    }
}

module.exports = {
    getAllUsers,
    Register,
    Login
}