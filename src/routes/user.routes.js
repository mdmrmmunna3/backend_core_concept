import {
    changeCurrentPassword,
    generateRefreshAccessToken,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loggedOutUser,
    loginUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateUserDetails,
    userRegister
} from "../controllers/user.controller.js";
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
userRouter.route("/refresh-token").post(generateRefreshAccessToken)

userRouter.route('/user').get(verifyJWT, getCurrentUser)
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword)
userRouter.route("/update-details").patch(verifyJWT, updateUserDetails)
userRouter.route("/update-avatar").patch(verifyJWT, upload.single('avatar'), updateUserAvatar)
userRouter.route("/update-coverImage").patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
userRouter.route("/c/:username").get(verifyJWT, getUserChannelProfile)
userRouter.route("/watchHistory").get(verifyJWT, getWatchHistory)
export default userRouter;