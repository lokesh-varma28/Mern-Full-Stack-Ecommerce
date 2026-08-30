const express = require("express");

const router = express.Router();

const {
    getRecommendations
} = require("../Controller/recommendationController");

router.get("/recommendations/:productId", getRecommendations);

module.exports = router;