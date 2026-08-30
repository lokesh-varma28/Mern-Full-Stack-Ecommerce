const Product = require("../Model/ProductModel");

// Get All Inventory
const getInventory = async (req, res) => {
    try {

        const products = await Product.find().select(
            "title stock price category brand"
        );

        res.status(200).json(products);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {

    try {

        const products = await Product.find({
            stock: { $lte: 10 }
        });

        res.status(200).json(products);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Get Out Of Stock Products
const getOutOfStockProducts = async (req, res) => {

    try {

        const products = await Product.find({
            stock: 0
        });

        res.status(200).json(products);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Update Stock
const updateStock = async (req, res) => {

    try {

        const { stock } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({
                message: "Product Not Found"
            });

        }

        product.stock = stock;

        await product.save();

        res.status(200).json({

            message: "Stock Updated Successfully",

            product

        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

module.exports = {

    getInventory,

    getLowStockProducts,

    getOutOfStockProducts,

    updateStock

};