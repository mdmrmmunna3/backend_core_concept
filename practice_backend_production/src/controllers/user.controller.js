import { asyncHandlerr } from "../uttils/asyncHandlerr.js";
import { apiErr } from "../uttils/apiErr.js";
import { User } from "../models/user.models.js";
import { uplodedCloudinary } from "../uttils/cloudinary.js";
import { apiRes } from "../uttils/apiRes.js";
import jwt from "jsonwebtoken"
import { json } from "express";
import mongoose, { Schema } from "mongoose";

export const getAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessTokens();
        const refreshToken = user.generateRefreshTokens();

        user.refreshToken = refreshToken;

        user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiErr(500, error?.message || "Something went wrong while generate access token and refresh token")
    }
}

const getUserRegister = asyncHandlerr(async (req, res) => {
    /** 
     * steps of data algorithom
     * get all user register input data on req.body
     * insure all data filed are required . check validation
     * check user alreday exists validation like username or email
     * check image are not empty , required, save successfully server
     * after save successfully server upload on cloudinary , that time also sure avatar are required and successfully uploaded if avatar is empty manage it.
     * create user object and entry in database
     * check properly on before save user object remove password and refresh token from response
     * check user creation successfully and save 
     * return res
     * 
    */

    const { username, fullname, email, password } = req.body;

    if (
        [username, fullname, email, password].some((field) => field?.trim() === "")
    ) {
        throw new apiErr(400, "All field are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new apiErr(405, "User with username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLoacalPath;
    if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
        coverImageLoacalPath = req.files?.coverImage[0]?.path;
    }
    // console.log(`Avatar: ${avatarLocalPath}, \n coverImage: ${coverImageLoacalPath}`)

    if (!avatarLocalPath) {
        throw new apiErr(406, "Avatar field are required!")
    }

    const avatar = await uplodedCloudinary(avatarLocalPath);
    const coverImage = await uplodedCloudinary(coverImageLoacalPath);
    if (!avatar) {
        throw new apiErr(406, "Avatar field are required!")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiErr(500, "something went wrong while user register ")
    }

    return res
        .status(201)
        .json(
            new apiRes(
                201,
                createdUser,
                "User Register Successfully!"
            )
        )
})


const getUserLogin = asyncHandlerr(async (req, res) => {
    /**
     * steps:
     * get data in > reg.body
     * check if username or email are exsist.. 
     * find password and check this password to match db store password . if password not match shown errors.
     * generate access token and refresh token 
     * send secure token used by cooike parser cookie
     * return res.send;
     *  */

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new apiErr(401, "username or email are required!")
    }
    if (!password) {
        throw new apiErr(401, "password are required!")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new apiErr(404, "Username or email are not exsist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiErr(405, "Invalid User Credentials")
    }

    const { accessToken, refreshToken } = await getAccessTokenAndRefreshToken(user?._id)
    const loggedInUser = await User.findById(user?._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Login SuccessFully"
        )

})

const getUserLogout = asyncHandlerr(async (req, res) => {
    /**
     * steps: 
     * get access token and verify this token useing jsonwebtoken verification method
     * first create req.user for logout 
     * remove accesstoken and refresh token 
     * clear cookie
     * reset refresh token in user data
     * 
    */

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiRes(200, {}, "User LoggedOUt Successfully")
        )
})

const getGenerateRefreshAccessToken = asyncHandlerr(async (req, res) => {
    const inCommingRefreshToken = req.cookies.refreshToken || req.body?.refreshToken;
    if (!inCommingRefreshToken) {
        throw new apiErr(400, "Unautorized Request!")
    }
    try {
        const decodedToken = jwt.verify(
            inCommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new apiErr(401, "Invalid Refresh Token")
        }

        if (inCommingRefreshToken !== user?.refreshToken) {
            throw new apiErr(401, "refresh Token is expired and used")
        }

        const { accessToken, newRefreshTokenn } = await getAccessTokenAndRefreshToken(user?._id)
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshTokenn, options)
            .json(
                new apiRes(
                    200,
                    {
                        user: accessToken, refreshToken: newRefreshTokenn
                    }
                )
            )
    } catch (error) {
        throw new apiErr(406, "Invalid RefreshToken")
    }
})

const getCurrentChangePassword = asyncHandlerr(async (req, res) => {
    const { oldPaasword, newPassword } = req.body;
    if (!oldPaasword || !newPassword) {
        throw new apiErr(402, "Old password and newPassword must be required")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordValidtion = user.isPasswordCorrect(oldPaasword)
    if (!isPasswordValidtion) {
        throw new apiErr(409, "Invalid Credentilas")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(
            new apiRes(
                200,
                {},
                "Password cahnge successfully"
            )
        )
})

const getCurreentLoggedUser = asyncHandlerr(async (req, res) => {
    return res
        .status(200)
        .json(
            new apiRes(
                200,
                req.user,
                "Current Logged User Data fetched Successfully"
            )
        )
})

const getUpdateUserAccountDetails = asyncHandlerr(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new apiErr(401, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new apiRes(
                200,
                user,
                "Update user account details successfully"
            )
        )
})

const getUpdateUserAvatar = asyncHandlerr(async (req, res) => {
    const avatarLocalPathh = req.file?.path;
    if (!avatarLocalPathh) {
        throw new apiErr(401, "avatar is missing or required")
    }

    const cloudiAvatar = await uplodedCloudinary(avatarLocalPathh);
    if (!cloudiAvatar?.url) {
        throw new apiErr(404, "Something went wrong while Upload new avatar on cloudinary ")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: cloudiAvatar?.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new apiRes(200, user, "User avatar update Successfully")
        )
})

const getUpdateUserCoverImage = asyncHandlerr(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new apiErr(401, "cover image is missing or required")
    }

    const cloudiCoverImage = await uplodedCloudinary(coverImageLocalPath);
    if (!cloudiCoverImage?.url) {
        throw new apiErr(404, "Something went wrong while Upload new cover image on cloudinary ")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: cloudiCoverImage?.url
            }
        }, {
        new: true
    }
    ).select("-password")

    return res
        .status(200)
        .json(
            new apiRes(200, user, "User Cover Image update Successfully")
        )

})

const getUserChannelProfile = asyncHandlerr(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new apiErr(404, "username not found")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // for subscriber 
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // for suscribedTo 
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
                subscriptionCounts: {
                    $size: "$subscribers"
                },
                subscribedToCounts: {
                    $size: "$subscribedTo"
                },
                isPublished: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscibers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribedToCounts: 1,
                subscriptionCounts: 1,
                isPublished: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new apiErr(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new apiRes(200, channel[0], "User Channel profile data fetched Successfully")
        )
})

const getUserWatchHistory = asyncHandlerr(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new Schema.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
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
                                        fullname: 1,
                                        username: 1,
                                        email: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "owner"
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
            new apiRes(200, user[0].watchHistory, "watch history fetched successfully")
        )
})

export {
    getUserRegister,
    getUserLogin,
    getUserLogout,
    getGenerateRefreshAccessToken,
    getCurreentLoggedUser,
    getCurrentChangePassword,
    getUpdateUserAccountDetails,
    getUpdateUserAvatar,
    getUpdateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}