import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String, // upload on cloudinary
        required: true
    },
    thumbnail: {
        type: String, // upload on cloudinary
        required: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
},
    { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)