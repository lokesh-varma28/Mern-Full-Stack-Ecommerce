const Question = require("../Model/questionModel");

// ==========================
// Ask Question
// ==========================

const askQuestion = async (req, res) => {

    try {

        const { productId, question } = req.body;

        const userId = req.user.userId;

        if (!question || question.trim() === "") {

            return res.status(400).json({
                success: false,
                message: "Question is required"
            });

        }

        const newQuestion = await Question.create({

            product: productId,

            user: userId,

            question

        });

        res.status(201).json({

            success: true,

            message: "Question Submitted Successfully",

            question: newQuestion

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ==========================
// Get Product Questions
// ==========================

const getQuestions = async (req, res) => {

    try {

        const questions = await Question.find({

            product: req.params.productId

        })

        .populate("user", "name")

        .populate("answeredBy", "name")

        .sort({ createdAt: -1 });

        res.json({

            success: true,

            questions

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ==========================
// Admin Answer Question
// ==========================

const answerQuestion = async (req, res) => {

    try {

        const { answer } = req.body;

        const question = await Question.findById(req.params.id);

        if (!question) {

            return res.status(404).json({

                success: false,

                message: "Question Not Found"

            });

        }

        question.answer = answer;

        question.isAnswered = true;

        question.answeredBy = req.user.userId;

        await question.save();

        res.json({

            success: true,

            message: "Answer Added Successfully",

            question

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ==========================
// Admin Get All Questions
// ==========================

const getAllQuestions = async (req, res) => {

    try {

        const questions = await Question.find()

            .populate("product", "title")

            .populate("user", "name")

            .populate("answeredBy", "name")

            .sort({ createdAt: -1 });

        res.json({

            success: true,

            questions

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {

    askQuestion,

    getQuestions,

    answerQuestion,

    getAllQuestions

};