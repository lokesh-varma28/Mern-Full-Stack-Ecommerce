const express = require("express");

const router = express.Router();

const auth = require("../MiddleWare/authMiddleware");
const upload = require("../MiddleWare/uploadReview");

const {
    addReview,
    getReviews,
    updateReview,
    deleteReview
} = require("../Controller/reviewController");

router.post("/review", auth, upload.array("images", 5), addReview);

router.get("/review/:productId", getReviews);

router.put("/review/:id", auth, updateReview);

router.delete("/review/:id", auth, deleteReview);

module.exports = router;
