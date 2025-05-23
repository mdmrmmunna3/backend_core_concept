import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {

    try {
        if (!localFilePath) return null

        // upload the file on cloudinary 
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // for any type 
        })
        // file has been  uploaded successfully 
        // console.log("file uploaded successfully!!", res.url);
        fs.unlinkSync(localFilePath)
        return res;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the uploaded operation got failed!
        return null;
    }
}

export { uploadOnCloudinary }