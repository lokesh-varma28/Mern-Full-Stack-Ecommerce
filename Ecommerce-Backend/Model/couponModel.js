const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({

    code:{
        type:String,
        required:true,
        unique:true,
        uppercase:true,
        trim:true
    },

    description:{
        type:String,
        default:""
    },

    discountType:{
        type:String,
        enum:["flat","percentage"],
        required:true
    },

    discountValue:{
        type:Number,
        required:true
    },

    minimumAmount:{
        type:Number,
        default:0
    },

    maximumDiscount:{
        type:Number,
        default:0
    },

    usageLimit:{
        type:Number,
        default:100
    },

    usedCount:{
        type:Number,
        default:0
    },

    onlyFirstOrder:{
        type:Boolean,
        default:false
    },

    active:{
        type:Boolean,
        default:true
    },

    expiry:{
        type:Date,
        required:true
    }

},{timestamps:true})

module.exports =
mongoose.models.Coupon ||
mongoose.model("Coupon",couponSchema)