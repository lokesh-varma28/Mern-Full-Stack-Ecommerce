var cloudinary = require("../config/cloudinary");

async function uploadToCloudinary(filepath) {
    try {
        const result = await cloudinary.uploader.upload(filepath, {
            folder: "uploads"
        });

        return {
            url: result.secure_url,
            publicId: result.public_id
        };

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Image upload failed");
    }
}

module.exports = {
    uploadToCloudinary
};