import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { getUserLogin, getUserLogout, getUserRegister } from "../controllers/user.controller.js";
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
export default router;