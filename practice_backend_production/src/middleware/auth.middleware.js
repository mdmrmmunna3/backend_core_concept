import { User } from "../models/user.models.js";
import { apiErr } from "../uttils/apiErr.js";
import { asyncHandlerr } from "../uttils/asyncHandlerr.js";
import jwt from "jsonwebtoken"

export const verifyJWt = asyncHandlerr(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")
        if (!token) {
            throw new apiErr(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = User.findById(decodedToken).select("-password -refreshToken");
        if (!user) {
            throw new apiErr(402, "Invalid Access Token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new apiErr(500, "Invalid Access Token")
    }
})
