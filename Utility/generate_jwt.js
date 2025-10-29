const jwt = require('jsonwebtoken');


module.exports = async (payload) => {
    const token = await jwt.sign(payload,
        process.env.JWT_TOKEN,
        { expiresIn: '10h' })
return token
}