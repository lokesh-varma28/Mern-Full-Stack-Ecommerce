const Product = require("../Model/ProductModel");

const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("category");

        res.json(categories);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    getCategories
};