import { User } from "../models/user.model";
import { ApiErrors } from "../utils/ApiErrors";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;

        await user.save({ validatedBeforeSave: false }) // stop keken problem 
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiErrors(500, error?.message || "something went wrong while generating access token and refresh token")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    /**
     * steps: 
     * get data -> reg.body
     * username or email 
     * find user by username or email for exsist user
     * check password . if password wrong and not matching stored password shown error message
     * generate access token and refresh token 
     * send cookie
     *  */

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiErrors(400, "username or email are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiErrors(404, "username or email are not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiErrors(402, "Invalid User Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true, // modify just server
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Login successfully"
            )
        )

})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true, // modify just server
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User Logged Out successfully"
            )
        )
})

export { loginUser, logOutUser }