
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }) // stop keken problem

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiErrors(500, error?.message || "something went wrong while generating access token and refresh token")
    }
}

const userRegister = asyncHandler(async (req, res) => {
    /**
     * steps
     * check get all user details from frontend
     * validation user details filed: like not empty, required
     * check if user already exists: check username, email
     * check for image, check for avatar to get successfully in server
     * then upload in cloudinary , if no avatar check this to properly uploded
     * create user object - create entry in database
     * remove password or refresh token filed from response
     * check for user creation 
     * retrun response 
     *  */

    const { username, fullName, email, password } = req.body;
    // console.log(email, username, fullName, password);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiErrors(400, "All field are required")
    }

    if (!isValid) {
        throw new ApiErrors(405, "please input valid email")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiErrors(409, "User with email and username are already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatarLocalPath);
    // const coverImageLoacalPath = req.files?.coverImage[0]?.path;
    // console.log(coverImageLoacalPath);
    let coverImageLoacalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLoacalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "avatar file are required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLoacalPath);

    if (!avatar) {
        throw new ApiErrors(400, "avatar file are required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiErrors(500, "Something went Wrong while registering user!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    /**  
     * steps: 
     * reg.body -> data
     * email or username 
     * check to find user this email or username  are match in db stored email or username data
     * password check .. if password got worng then show error and tell a valid password in match stored db password
     * genareate access token and refresh token 
     * send secure cookie
     * */

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiErrors(400, "username or email are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiErrors(404, "username or email are not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrors(402, "Invalid User Credentials")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true, // modify just server
        secure: true
    }

    return res.
        status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const loggedOutUser = asyncHandler(async (req, res) => {
    /**
     * steps: 
     * remove access token and refresh token 
     * reset refresh token in user data
     *  */

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

export {
    userRegister,
    loginUser,
    loggedOutUser
}