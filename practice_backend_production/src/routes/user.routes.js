import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
    getCurreentLoggedUser,
    getCurrentChangePassword,
    getGenerateRefreshAccessToken,
    getUpdateUserAccountDetails,
    getUpdateUserAvatar,
    getUpdateUserCoverImage,
    getUserChannelProfile,
    getUserLogin,
    getUserLogout,
    getUserRegister,
    getUserWatchHistory
} from "../controllers/user.controller.js";
import { verifyJWt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
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
    ), getUserRegister
)

router.route("/login").post(getUserLogin)
router.route("/logout").post(verifyJWt, getUserLogout)
router.route("/refreshToken").post(getGenerateRefreshAccessToken)
router.route("/change-password").post(verifyJWt, getCurrentChangePassword)
router.route("/user").get(verifyJWt, getCurreentLoggedUser)
router.route("/update-details").patch(verifyJWt, getUpdateUserAccountDetails)
router.route("/update-avatar").patch(verifyJWt, upload.single('avatar'), getUpdateUserAvatar)
router.route("/update-coverImage").patch(verifyJWt, upload.single('coverImage'), getUpdateUserCoverImage)
router.route("/c/:username").get(verifyJWt, getUserChannelProfile)
router.route("/watch-history").get(verifyJWt, getUserWatchHistory)
export default router;