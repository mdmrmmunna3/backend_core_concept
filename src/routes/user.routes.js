import { userRegister } from "../controllers/user.controller.js";
import { Router } from "express";

const userRouter = Router();

userRouter.route("/register").post(userRegister);

export default userRouter;