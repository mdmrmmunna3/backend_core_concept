import { loggedOutUser, loginUser, userRegister } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.route("/register").post(
    upload.fields(
        [
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]
    )
    , userRegister);

userRouter.route("/login").post(loginUser);

userRouter.route("/logOut").post(verifyJWT, loggedOutUser);

export default userRouter;