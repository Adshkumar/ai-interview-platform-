const usermodel = require("../models/user.model")
const blacklistmodel = require("../models/blacklist.model")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function registerUserController(req, res) {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Please provide Username, email, Password"
        });
    }

    const IsuserAlreadyExists = await usermodel.findOne({ email });

    if (IsuserAlreadyExists) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const user = new usermodel({
        name,
        email,
        password: hashedpassword
    });

    await user.save();

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        }
    });
}

async function loginUserController(req, res) {

    const { email, password } = req.body;

    const user = await usermodel.findOne({ email });

    if (!user) {
        return res.status(404).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        }
    });
}

async function logoutUserController(req, res) {

    const token = req.cookies.token;

    if (token) {
        await blacklistmodel.create({
            token
        })

        res.clearCookie("token");

        res.status(200).json({
            message: "User logged out successfully"
        });
    } else {
        res.status(400).json({
            message: "No token found"
        });
    }
}

// async function getMeController(req, res) {
//     try {
//         const user = await usermodel.findById(req.user.id);

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             });
//         }

//         res.status(200).json({
//             message: "User found successfully",
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//             }
//         });
//     } catch (error) {
//         console.error("GetMe error:", error);
//         res.status(500).json({
//             message: "Error fetching user",
//             error: error.message
//         });
//     }
// }
async function getMeController(req, res) {
    try {
        // console.log('===== GET ME DEBUG =====');
        // console.log('req.user:', req.user);
        // console.log('req.user.id:', req.user?.id);
        // console.log('Cookies:', req.cookies);

        const user = await usermodel.findById(req.user.id);
        // console.log('Found user:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User found successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        });
    } catch (error) {
        // console.error("GetMe error:", error);
        res.status(500).json({
            message: "Error fetching user",
            error: error.message
        });
    }
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};