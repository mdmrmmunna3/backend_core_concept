
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


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

const generateRefreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiErrors(401, "unautorized request")
    }

    try {
        // verify incomming token 
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiErrors(401, "Invalid refresh token")
        }

        // match each token 
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiErrors(401, " refresh token is expired and used")
        }
        // generate new token 
        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }

        // return response with new token
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    " access token refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiErrors(
            401,
            error?.message || "Invalid refresh token "
        )
    }
})

// forgate password / new password

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiErrors(404, "old password and new password are required")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiErrors(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, res.user, " Current User fetch successfully")
        )
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiErrors(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            200,
            user,
            "Update user details successfully"
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiErrors(401, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new ApiErrors(404, "Error while uploading avatar file in cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Update Cover image successfully")
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiErrors(400, "cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage?.url) {
        throw new ApiErrors(404, "Error while uploading cover Image file in cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage?.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Update Cover image successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiErrors(400, "username not found")
    }

    // define aggregate pipeline 
    // if you get subscribers, so count channel , and get subscribedTo count subsriber 
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // subscribers lookup pipeline 
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // subscribeTo lookup pipeline 
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // add both lookup pipeline field 
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers" // use $ sign because this is a field
                },
                subscribedChannelsCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // now use $project to pass the specified file to the next 
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedChannelsCount: 1,
                isSubscribed: 1
            }
        }
    ])

    /* const  channel2 = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedToChannelCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToChannelCount: 1,
                isSubscribed: 1
            }
        }
    ]) */

    if (!channel?.length) {
        throw new ApiErrors(404, "channel  does not exists")
    }
    console.log(channel)
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User Channel fetched Successfully")
        )

})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // write nested pipeline useing pipeline
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // send as a object in frontend 
                    {
                        $addFields: {
                            onwer: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully")
        )
})

export {
    userRegister,
    loginUser,
    loggedOutUser,
    generateRefreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile

}