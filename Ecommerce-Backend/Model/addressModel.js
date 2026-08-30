const mongoose = require("mongoose")

const addressSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    fullName:{
        type:String,
        required:true
    },

    mobile:{
        type:String,
        required:true
    },

    pincode:{
        type:String,
        required:true
    },

    house:{
        type:String,
        required:true
    },

    area:{
        type:String,
        required:true
    },

    landmark:{
        type:String
    },

    city:{
        type:String,
        required:true
    },

    state:{
        type:String,
        required:true
    },

    country:{
        type:String,
        default:"India"
    },

    addressType:{
        type:String,
        enum:["Home","Office","Other"],
        default:"Home"
    },

    isDefault:{
        type:Boolean,
        default:false
    }

},{timestamps:true})

module.exports =
mongoose.models.Address ||
mongoose.model("Address",addressSchema)