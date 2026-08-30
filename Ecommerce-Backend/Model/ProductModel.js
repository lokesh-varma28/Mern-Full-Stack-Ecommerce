

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    stock: {
        type: Number,
        default: 0
    },

    category: {
        type: String,
        default: "General"
    },

    brand: {
        type: String,
        default: "No Brand"
    },

    discount: {
        type: Number,
        default: 0
    },

    featured: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },

    image: {

        url: {
            type: String,
            required: true
        },

        publicId: {
            type: String,
            required: true
        }

    },

//     reviews: [

//         {

//             user: {
//                 type: String,
//                 required: true
//             },

//             rating: {
//                 type: Number,
//                 required: true,
//                 min: 1,
//                 max: 5
//             },

//             comment: {
//                 type: String,
//                 default: ""
//             },

//             createdAt: {
//                 type: Date,
//                 default: Date.now
//             }

//         }

//     ],
reviews: [

    {

        user: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },

        name: {

            type: String,

            required: true

        },

        rating: {

            type: Number,

            required: true,

            min: 1,

            max: 5

        },

        comment: {

            type: String,

            default: ""

        },

        createdAt: {

            type: Date,

            default: Date.now

        }

    }

],

    numReviews: {
        type: Number,
        default: 0
    },
   
    averageRating: {
        type: Number,
        default: 0
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.models.Product ||
    mongoose.model("Product", productSchema);