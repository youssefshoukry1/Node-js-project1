const { body } = require('express-validator');
const verifyToken = require('../middleware/verifyToken');

const express = require('express')
const router = express.Router()
const couseController = require('../Controlls/Courses-api');
const userRole = require('../Utility/user_roles');
const allowedTo = require('../middleware/allowedTo');

router.route('/')
    .get(verifyToken,couseController.getAllCourses)
    .post(verifyToken,couseController.addCourse)

router.route('/:courseId')
    .get(couseController.getCourse_Id)
    .patch(couseController.UpdateCourse)
    .delete(verifyToken,allowedTo(userRole.ADMIN,userRole.MANEGER),couseController.DeleteCourse)

module.exports = router