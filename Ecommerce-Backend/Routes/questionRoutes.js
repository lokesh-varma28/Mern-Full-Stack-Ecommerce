const express = require("express");

const router = express.Router();

const auth = require("../MiddleWare/authMiddleware");

const {

    askQuestion,

    getQuestions,

    answerQuestion,

    getAllQuestions

} = require("../Controller/questionController");

// Customer Ask Question
router.post("/question", auth, askQuestion);

// Everyone can View Questions
router.get("/question/:productId", getQuestions);

// Admin Answer
router.put("/question/:id", auth, answerQuestion);

router.get("/admin/questions", auth, getAllQuestions);

module.exports = router;