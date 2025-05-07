import mongoose, { Schema } from "mongoose";
import bycrpt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        index: true
    },
    avatar: {
        type: String, // upload on cloudinary
        required: true
    },
    coverImage: {
        type: String, // upload on cloudinary
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    watchHistory: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Video"
        }
    ]

}, { timestamps: true })

// check password validation before save pre hook middleware
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    try {
        this.password = await bycrpt.hash(this.password, 10)
        next()
    } catch (error) {
        next(error)
    }
})

// generate accessToken jwt 
userSchema.methods.generateAccessTokens = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// generate refreshToken 
userSchema.methods.generateRefreshTokens = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

// compare password 
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bycrpt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)