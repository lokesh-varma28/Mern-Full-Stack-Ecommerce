const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
{
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    question: {
        type: String,
        required: true,
        trim: true
    },

    answer: {
        type: String,
        default: ""
    },

    answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    isAnswered: {
        type: Boolean,
        default: false
    }

},
{
    timestamps: true
});

module.exports =
mongoose.models.Question ||
mongoose.model("Question", questionSchema);