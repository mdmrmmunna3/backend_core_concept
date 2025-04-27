
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const userRegister = asyncHandler(async (req, res) => {
    /**
     * steps
     * check get all user details from frontend
     * validation user details filed: like not empty, required
     * check if user already exists: check username, email
     * check for image, check for avatar to get successfully in server
     * then upload in cloudinary , if no avatar check this to properly uploded
     * create user object - create entry in database
     * remove password for refresh token filed from response
     * check for user creation 
     * retrun response 
     *  */

    const { username, fullname, email, password } = req.body;
    console.log(email, username, fullname, password);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiErrors(400, "All field are required")
    }

    if (!isValid) {
        throw new ApiErrors(405, "please input valid email")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiErrors(409, "User with email and username are already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    const coverImageLoacalPath = req.files?.coverImage[0]?.path;
    console.log(coverImageLoacalPath);

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "avatar file are required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiErrors(400, "avatar file are required")
    }

    const user = await User.create({
        fullname,
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

export { userRegister }