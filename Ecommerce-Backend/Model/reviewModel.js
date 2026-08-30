const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },

    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },

    comment:{
        type:String,
        required:true
    },

    // ✅ Verified Purchase
    verifiedPurchase:{
        type:Boolean,
        default:false
    },

    // ✅ Review Images
    images:[
        {
            public_id:{
                type:String
            },
            url:{
                type:String
            }
        }
    ]

},
{
    timestamps:true
});

module.exports =
mongoose.models.Review ||
mongoose.model("Review",reviewSchema);