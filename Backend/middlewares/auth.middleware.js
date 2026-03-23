const jwt = require("jsonwebtoken");
const tokenblacklist = require("../models/blacklist.model");

async function authUser(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Token not provided."
            });
        }

        const IsTokenBlacklist = await tokenblacklist.findOne({ token });

        if (IsTokenBlacklist) {
            return res.status(401).json({
                message: "Token is invalid."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            message: "Token invalid"
        });
    }
}

module.exports = authUser;