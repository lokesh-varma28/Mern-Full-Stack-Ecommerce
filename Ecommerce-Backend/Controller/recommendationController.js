const Product = require("../Model/ProductModel");

const getRecommendations = async (req, res) => {
    try {

        const { productId } = req.params;

        const currentProduct = await Product.findById(productId);

        if (!currentProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Similar products (excluding current product)
        const similarProducts = await Product.find({
            _id: { $ne: productId }
        })
        .sort({ averageRating: -1 })
        .limit(8);

        // Trending products
        const trendingProducts = await Product.find()
            .sort({
                numReviews: -1,
                averageRating: -1
            })
            .limit(8);

        res.status(200).json({
            currentProduct,
            similarProducts,
            trendingProducts
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    getRecommendations
};