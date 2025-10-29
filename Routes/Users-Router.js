const { body } = require('express-validator');
const verifyToken = require('../middleware/verifyToken');
const express = require('express')
const router = express.Router()
const userController = require('../Controlls/Users-api')
const multer = require('multer')
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('file', file);
        cb(null, 'uploads')
    },
    filename: function (req, file, cd) {
        const ext = file.mimetype.split('/')[1]
        const fileName = `user-${Date.now()}.${ext}`
        cd(null, fileName)
    }
})
const upload = multer({ storage: diskStorage })
//get All Users
//register
//Login
router.route('/')
    .get(verifyToken, userController.getAllUsers)

router.route('/login')
    .post(userController.Login)

router.route('/register')
    .post(upload.single('avatar'), userController.Register)
module.exports = router