const Coupon = require("../Model/couponModel")
const User = require("../Model/UserModel")
const Order = require("../Model/orderModel")

// ===============================
// CREATE COUPON (ADMIN)
// ===============================

const createCoupon = async (req, res) => {

    try {
        

        const exists = await Coupon.findOne({

            code: req.body.code.toUpperCase()

        })

        if (exists) {

            return res.status(400).json({

                message: "Coupon already exists"

            })

        }

        const coupon = await Coupon.create({

            ...req.body,

            code: req.body.code.toUpperCase()

        })

        res.status(201).json({

            success: true,

            coupon

        })

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        })

    }

}



// ===============================
// GET ALL COUPONS
// ===============================

const getCoupons = async (req, res) => {

    try {

        const coupons = await Coupon.find().sort({

            createdAt: -1

        })

        res.json(coupons)

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        })

    }

}



// ===============================
// APPLY COUPON
// ===============================

const applyCoupon = async (req, res) => {

    try {

        const {

            code,

            cartTotal

        } = req.body

        const userId = req.user.userId

        const coupon = await Coupon.findOne({

            code: code.toUpperCase()

        })

        if (!coupon) {

            return res.status(404).json({

                message: "Coupon not found"

            })

        }

        if (!coupon.active) {

            return res.status(400).json({

                message: "Coupon inactive"

            })

        }

        if (coupon.expiry < new Date()) {

            return res.status(400).json({

                message: "Coupon expired"

            })

        }

        if (coupon.usedCount >= coupon.usageLimit) {

            return res.status(400).json({

                message: "Coupon limit reached"

            })

        }

        if (cartTotal < coupon.minimumAmount) {

            return res.status(400).json({

                message:
                    `Minimum order ₹${coupon.minimumAmount}`

            })

        }

        if (coupon.onlyFirstOrder) {

            const orders = await Order.countDocuments({

                userId

            })

            if (orders > 0) {

                return res.status(400).json({

                    message:
                        "Only first order eligible"

                })

            }

        }

        let discount = 0

        if (coupon.discountType === "flat") {

            discount = coupon.discountValue

        }

        else {

            discount =

                (cartTotal * coupon.discountValue) / 100

            if (

                coupon.maximumDiscount > 0 &&

                discount > coupon.maximumDiscount

            ) {

                discount = coupon.maximumDiscount

            }

        }

        res.json({

            success: true,

            coupon: coupon.code,

            originalAmount: cartTotal,

            discount,

            finalAmount: cartTotal - discount

        })

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        })

    }

}

// UPDATE COUPON
const updateCoupon = async (req, res) => {
    try {

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon Not Found"
            });
        }

        res.json({
            message: "Coupon Updated",
            coupon
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};




// ===============================
// DELETE COUPON
// ===============================

const deleteCoupon = async (req, res) => {

    try {

        await Coupon.findByIdAndDelete(req.params.id)

        res.json({

            success: true,

            message: "Coupon Deleted"

        })

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        })

    }

}




module.exports = {

    createCoupon,

    getCoupons,

    applyCoupon,

    deleteCoupon,

    updateCoupon

}