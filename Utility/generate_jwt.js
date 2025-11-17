const jwt = require("jsonwebtoken");

module.exports = (payload) => {
    const token = jwt.sign(
        payload,
        process.env.JWT_TOKEN,
        { expiresIn: "14d" }
    );
    return token;
};
