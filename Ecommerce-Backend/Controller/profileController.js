
var User = require("../Model/UserModel")

var bcrypt = require("bcrypt")

var getProfile = async(req,res)=>{
    try{
        var userId = req.user.userId
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
        var userId = req.user.userId
        if(!userId){
            return res.status(403).json({message : "no user found"})
        }
        var {name,email,password} = req.body 
        var updatedUser = {}
        if(name){
            updatedUser.name = name
        }
        if(email){
            updatedUser.email = email
        }
        if(password){
            var hashedPassword = await bcrypt.hash(password,10)
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

module.exports = {
    getProfile,
    updateProfile
}

