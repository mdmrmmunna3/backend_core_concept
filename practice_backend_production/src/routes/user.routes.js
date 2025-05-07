import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { getUserRegister } from "../controllers/user.controller.js";

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

export default router;