const Product = require("../Model/ProductModel");

const getBrands = async (req, res) => {
    try {
        const brands = await Product.distinct("brand");

        res.json(brands);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    getBrands
};