import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = (fileBuffer, folder = "rdeens") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    // Write the buffer to the upload stream
    uploadStream.end(fileBuffer);
  });
};

export const uploadBase64ToCloudinary = async (base64String, folder = "rdeens/blogs") => {
  if (!base64String || typeof base64String !== "string" || !base64String.startsWith("data:image/")) {
    return base64String;
  }
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary base64 upload error:", error);
    return base64String;
  }
};

export default cloudinary;
