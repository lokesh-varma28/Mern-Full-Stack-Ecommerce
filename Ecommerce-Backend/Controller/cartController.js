const Cart = require("../Model/cartModel");
const Product = require("../Model/ProductModel");
const mongoose = require("mongoose");

// ======================
// GET CART
// ======================

const getCart = async (req, res) => {
    try {

        const userId = req.user.userId;

        const cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        return res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

// ======================
// ADD TO CART / INCREASE QUANTITY
// ======================

const addToCart = async (req, res) => {

    try {

        const userId = req.user.userId;
        const { productId } = req.body;

        if (!productId) {

            return res.status(400).json({
                message: "productId is required"
            });

        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {

            return res.status(400).json({
                message: "Invalid productId"
            });

        }

        const product = await Product.findById(productId);

        if (!product) {

            return res.status(404).json({
                message: "Product not found"
            });

        }

        if (product.stock <= 0) {

            return res.status(400).json({
                message: "Product is Out Of Stock"
            });

        }

        let cart = await Cart.findOne({
            user: userId
        });

        if (!cart) {

            cart = await Cart.create({

                user: userId,

                items: [
                    {
                        product: productId,
                        quantity: 1
                    }
                ]

            });

            return res.status(201).json({
                success: true,
                message: "Product added to cart",
                cart
            });

        }

        const existingItem = cart.items.find(

            item => item.product.toString() === productId.toString()

        );

        if (existingItem) {

            if (existingItem.quantity >= product.stock) {

                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} item(s) available in stock`
                });

            }

            existingItem.quantity++;

        }

        else {

            cart.items.push({
                product: productId,
                quantity: 1
            });

        }

        await cart.save();

        return res.status(200).json({

            success: true,

            message: "Cart Updated",

            cart

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================
// DECREASE QUANTITY
// ======================

const decreaseCartQuantity = async (req, res) => {

    try {

        const userId = req.user.userId;
        const { productId } = req.body;

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart) {

            return res.status(404).json({
                message: "Cart not found"
            });

        }

        const itemIndex = cart.items.findIndex(

            item => item.product.toString() === productId.toString()

        );

        if (itemIndex === -1) {

            return res.status(404).json({
                message: "Product not found in cart"
            });

        }

        cart.items[itemIndex].quantity--;

        if (cart.items[itemIndex].quantity <= 0) {

            cart.items.splice(itemIndex, 1);

        }

        await cart.save();

        return res.status(200).json({

            success: true,

            message: "Quantity Updated",

            cart

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================
// REMOVE ITEM
// ======================

const removeCartItem = async (req, res) => {

    try {

        const userId = req.user.userId;
        const { productId } = req.body;

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart) {

            return res.status(404).json({
                message: "Cart not found"
            });

        }

        cart.items = cart.items.filter(

            item => item.product.toString() !== productId

        );

        await cart.save();

        return res.status(200).json({

            success: true,

            message: "Item Removed",

            cart

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {

    getCart,

    addToCart,

    decreaseCartQuantity,

    removeCartItem

};