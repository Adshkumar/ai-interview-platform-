const { Router } = require("express");
const authcontroller = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const authRouter = Router();

authRouter.post("/register", authcontroller.registerUserController);
authRouter.post("/login", authcontroller.loginUserController);
authRouter.post("/logout", authcontroller.logoutUserController);

authRouter.get("/get-me", authMiddleware, authcontroller.getMeController);

module.exports = authRouter;