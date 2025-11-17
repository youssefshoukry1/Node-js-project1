
const Course = require('../models/Model-Course')

const getAllCourses = async (req, res) => {
    const query = req.query;
    console.log(query);

    const limit = parseInt(query.limit) || 10
    const page = parseInt(query.page) || 1

    const skip = (page - 1) * limit
    //get all courses from database using mongoose
    try {
        const courses = await Course.find({}, { "__v": false }).limit(limit).skip(skip)
        return res.json(courses)
    } catch (err) {
        return res.status(404).json({ msg: ' not found' })
    }
}

const getCourse_Id = async (req, res) => {
    try {
        const course_result = await Course.findById(req.params.courseId)
        return res.json(course_result).status(200)
    } catch (err) {
        return res.status(404).json({ msg: 'course not found' })
    }
}

const addCourse = async (req, res) => {
    console.log(req.body);
    try {
        const new_course = await new Course(req.body).save()
                console.log(new_course);
        return res.status(201).json(new_course)
        
    } catch (err) {
        return res.status(400).json({ msg: 'cant add the course' })
    }
}

const UpdateCourse = async (req, res) => {
    const courseId = req.params.courseId;
    try {
        const UpdateCourse = await Course.updateOne({ _id: courseId }, { $set: { ...req.body } });
        return res.status(200).json(UpdateCourse)
    } catch (err) {
        return res.status(400).json({ msg: 'cant complete the process' })
    }
}
const DeleteCourse = async (req, res) => {
    const courseId = req.params.courseId;
    try {
        const DeleteCourse = await Course.deleteOne({ _id: courseId })
        return res.status(200).json(DeleteCourse)
    } catch (err) {
        return res.status(400).json({ msg: 'cant delete the course' })
    }
}
module.exports = {
    getAllCourses,
    getCourse_Id,
    UpdateCourse,
    addCourse,
    DeleteCourse
}