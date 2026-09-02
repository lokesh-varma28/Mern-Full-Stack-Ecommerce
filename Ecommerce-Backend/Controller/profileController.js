
var User = require("../Model/UserModel")

var bcrypt = require("bcrypt")

const cloudinary = require("../config/cloudinary");

var getProfile = async(req,res)=>{
    try{
        var userId = req.user.userId || req.user._id || req.user.id;
        if(!userId){
            return res.status(403).json({message : "no user found"})
        }
        var user = await User.findById(userId).select("-password")
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        return res.status(200).json({user})
    }catch(error){
        console.log("error",error);
        return res.status(500).json({ message: "failed to fetch profile", error: error.message })
    }
}

var updateProfile = async(req,res)=>{
    try{
        var userId = req.user.userId || req.user._id || req.user.id;
        if(!userId){
            return res.status(403).json({message : "no user found"})
        }
        var {name, email, password, newPassword, currentPassword, mobile, phone} = req.body 
        var updatedUser = {}
        if(name){
            updatedUser.name = name
        }
        if(email){
            updatedUser.email = email
        }
        if(mobile || phone){
            updatedUser.phone = mobile || phone
        }
        
        const pwdToSet = newPassword || password;
        if(pwdToSet){
            const user = await User.findById(userId);
            if (user && user.password && currentPassword) {
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: "Incorrect current password" });
                }
            }
            var hashedPassword = await bcrypt.hash(pwdToSet, 10)
            updatedUser.password = hashedPassword
        }
        var updatedUserData = await User.findByIdAndUpdate(userId, updatedUser, { new: true }).select("-password")
        if (!updatedUserData) {
            return res.status(404).json({ message: "user not found" })
        }
        return res.status(200).json({ user: updatedUserData })

    }catch(error){
        console.log("error",error);
        return res.status(500).json({ message: "failed to update profile", error: error.message })
    }
}

var uploadAvatar = async(req, res) => {
    try {
        var userId = req.user.userId || req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "profile_avatars" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        if (user.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(user.avatarPublicId);
            } catch (err) {
                console.error("Failed to delete old Cloudinary avatar:", err);
            }
        }

        user.avatar = uploadResult.secure_url;
        user.avatarPublicId = uploadResult.public_id;
        await user.save();

        const updatedUser = await User.findById(userId).select("-password");
        return res.status(200).json({
            success: true,
            message: "Profile photo updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return res.status(500).json({ message: error.message || "Failed to upload profile photo" });
    }
};

var uploadCover = async(req, res) => {
    try {
        var userId = req.user.userId || req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "profile_covers" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        if (user.coverImagePublicId) {
            try {
                await cloudinary.uploader.destroy(user.coverImagePublicId);
            } catch (err) {
                console.error("Failed to delete old Cloudinary cover:", err);
            }
        }

        user.coverImage = uploadResult.secure_url;
        user.coverImagePublicId = uploadResult.public_id;
        await user.save();

        const updatedUser = await User.findById(userId).select("-password");
        return res.status(200).json({
            success: true,
            message: "Cover photo updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error uploading cover image:", error);
        return res.status(500).json({ message: error.message || "Failed to upload cover image" });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar,
    uploadCover
}


