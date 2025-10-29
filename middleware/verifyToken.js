const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if (!authHeader) {
        return res.status(404).json('token not found')
    }
    const token = authHeader.split(' ')[1];
    try {
        const currentUser = jwt.verify(token, process.env.JWT_TOKEN)
        req.currentUser = currentUser
        console.log('currentU',req.currentUser);
        next()
    } catch (err) {
        return res.status(401).json('invalid token');
    }
}
module.exports = verifyToken;