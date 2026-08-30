const Review = require("../Model/reviewModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");

// Fix: import cloudinary correctly from its config file
const cloudinary = require("../config/cloudinary");

// ========================
// ADD REVIEW
// ========================

const addReview = async (req, res) => {

    try {

        const userId = req.user.userId;

        const { productId, rating, comment } = req.body;

        let uploadedImages = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const result = await new Promise((resolve, reject) => {

                    cloudinary.uploader.upload_stream(

                        { folder: "reviews" },

                        (error, result) => {

                            if (error) reject(error);
                            else resolve(result);

                        }

                    ).end(file.buffer);

                });

                uploadedImages.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });

            }

        }

        // Check Purchase
        const purchased = await Order.findOne({
            userId,
            "items.product": productId
        });

        if (!purchased) {

            return res.status(403).json({
                message: "Purchase this product before reviewing."
            });

        }

        // Already Reviewed?
        const alreadyReviewed = await Review.findOne({
            user: userId,
            product: productId
        });

        if (alreadyReviewed) {

            return res.status(400).json({
                message: "You already reviewed this product."
            });

        }

        // Create Review
        const review = await Review.create({
            user: userId,
            product: productId,
            rating,
            comment,
            verifiedPurchase: true,
            images: uploadedImages
        });

        // Update Product Rating
        const reviews = await Review.find({ product: productId });

        const averageRating =
            reviews.reduce((sum, item) => sum + item.rating, 0) /
            reviews.length;

        await Product.findByIdAndUpdate(productId, {
            averageRating,
            numReviews: reviews.length
        });

        return res.status(201).json({
            success: true,
            message: "Review Added Successfully",
            review
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ========================
// GET REVIEWS
// ========================

const getReviews = async (req, res) => {

    try {

        const reviews = await Review.find({
            product: req.params.productId
        })
        .populate("user", "name")
        .sort({ createdAt: -1 });

        const ratingStats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        reviews.forEach(review => {
            ratingStats[review.rating]++;
        });

        const reviewsWithPurchase = await Promise.all(

            reviews.map(async (review) => {

                const purchased = await Order.findOne({
                    userId: review.user._id,
                    "items.product": review.product
                });

                return {
                    ...review.toObject(),
                    verifiedPurchase: !!purchased
                };

            })

        );

        return res.status(200).json({
            reviews: reviewsWithPurchase,
            ratingStats
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ========================
// UPDATE REVIEW
// ========================

const updateReview = async (req, res) => {

    try {

        const userId = req.user.userId;

        const { rating, comment } = req.body;

        const review = await Review.findOne({
            _id: req.params.id,
            user: userId
        });

        if (!review) {

            return res.status(404).json({
                message: "Review not found"
            });

        }

        review.rating = rating;
        review.comment = comment;
        await review.save();

        const reviews = await Review.find({ product: review.product });

        const averageRating =
            reviews.reduce((sum, item) => sum + item.rating, 0) /
            reviews.length;

        await Product.findByIdAndUpdate(review.product, {
            averageRating,
            numReviews: reviews.length
        });

        res.json({
            success: true,
            message: "Review Updated",
            review
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// ========================
// DELETE REVIEW
// ========================

const deleteReview = async (req, res) => {

    try {

        const userId = req.user.userId;

        const review = await Review.findOne({
            _id: req.params.id,
            user: userId
        });

        if (!review) {

            return res.status(404).json({
                message: "Review not found"
            });

        }

        const productId = review.product;

        await Review.findByIdAndDelete(review._id);

        const reviews = await Review.find({ product: productId });

        const averageRating =
            reviews.length > 0
                ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
                : 0;

        await Product.findByIdAndUpdate(productId, {
            averageRating,
            numReviews: reviews.length
        });

        res.json({
            success: true,
            message: "Review Deleted"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

module.exports = {
    addReview,
    getReviews,
    updateReview,
    deleteReview
};
