
const Product = require("../Model/ProductModel");
const { uploadToCloudinary } = require("../helper/cloudinaryhelper");
const { redisClient } = require("../config/redisClient");
// ================= GET ALL PRODUCTS =================

const getAllProducts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filters
        const keyword = req.query.keyword || "";
        const category = req.query.category || "";
        const brand = req.query.brand || "";
        const minPrice = Number(req.query.minPrice) || 0;
        const maxPrice = Number(req.query.maxPrice) || 1000000;

        let filter = {};

        if (keyword) {
            filter.title = {
                $regex: keyword,
                $options: "i"
            };
        }

        if (category) {
            filter.category = category;
        }

        if (brand) {
            filter.brand = brand;
        }

        filter.price = {
            $gte: minPrice,
            $lte: maxPrice
        };

        // Redis Cache Key
        const cacheKey = `allproducts:${page}:${limit}:${keyword}:${category}:${brand}:${minPrice}:${maxPrice}`;

        if (redisClient.isOpen) {

            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {

                console.log("✅ Data from Redis");

                return res.status(200).json(JSON.parse(cachedData));

            }

        }

        const totalProducts = await Product.countDocuments(filter);

        // const products = await Product.find(filter)
        //     .skip(skip)
        //     .limit(limit);

        let sort = {};

const sortBy = req.query.sort || "";

if (sortBy === "priceLow") {

    sort.price = 1;

}

else if (sortBy === "priceHigh") {

    sort.price = -1;

}

else if (sortBy === "rating") {

    sort.averageRating = -1;

}

else if (sortBy === "newest") {

    sort.createdAt = -1;

}

const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

        const response = {
            total: totalProducts,
            page,
            limit,
            totalPages: Math.ceil(totalProducts / limit),
            products
        };

        if (redisClient.isOpen) {

            await redisClient.setEx(
                cacheKey,
                3600,
                JSON.stringify(response)
            );

        }

        console.log("📦 Data from MongoDB");

        res.status(200).json(response);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });

    }
};

// ================= GET SINGLE PRODUCT =================

const getSingleProduct = async (req, res) => {

    try {

        const id = req.params.id;

        const cacheKey = `product:${id}`;

        if (redisClient.isOpen) {

            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {

                return res.status(200).json({
                    singleProduct: JSON.parse(cachedData)
                });

            }

        }

        const product = await Product.findById(id);

        if (!product) {

            return res.status(404).json({
                message: "Product not found"
            });

        }

        if (redisClient.isOpen) {

            await redisClient.setEx(
                cacheKey,
                3600,
                JSON.stringify(product)
            );

        }

        res.status(200).json({
            singleProduct: product
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to fetch product"
        });

    }

};
// ================= RELATED PRODUCTS =================

const getRelatedProducts = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({
                message: "Product not found"
            });

        }

        const related = await Product.find({

            _id: { $ne: product._id },

            $or: [

                { category: product.category },

                { brand: product.brand }

            ]

        }).limit(4);

        res.json(related);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: err.message

        });

    }

};

// ================= RECOMMENDED PRODUCTS =================

const getRecommendedProducts = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        const products = await Product.find({

            _id: { $ne: product._id },

            $or: [

                { category: product.category },

                { brand: product.brand }

            ]

        })

        .sort({ averageRating: -1 })

        .limit(6);

        res.status(200).json({

            success: true,

            products

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// ================= ADD PRODUCT =================

const addNewProduct = async (req, res) => {

    try {

        const {
            title,
            description,
            price,
            stock
        } = req.body;

        if (!req.file) {

            return res.status(400).json({
                message: "Image is required"
            });

        }

        const { url, publicId } = await uploadToCloudinary(req.file.path);

        const product = await Product.create({

            title,
            description,
            price,
            stock,
            // images,

            image: {
                url,
                publicId
            }

        });

        if (redisClient.isOpen) {

            const keys = await redisClient.keys("allproducts:*");

            if (keys.length) {

                await redisClient.del(keys);

            }

        }

        res.status(201).json({

            message: "Product Added Successfully",

            product

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Failed to add product"

        });

    }

};

// ================= UPDATE PRODUCT =================

const updateProduct = async (req, res) => {

    try {

        const id = req.params.id;

        const {
            title,
            description,
            price,
            stock
        } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(

            id,

            {
                title,
                description,
                price,
                stock
            },

            {
                new: true
            }

        );

        if (!updatedProduct) {

            return res.status(404).json({

                message: "Product not found"

            });

        }

        if (redisClient.isOpen) {

            await redisClient.del(`product:${id}`);

            const keys = await redisClient.keys("allproducts:*");

            if (keys.length) {

                await redisClient.del(keys);

            }

        }

        res.status(200).json({

            message: "Product Updated Successfully",

            product: updatedProduct

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Failed to update product"

        });

    }

};

// ================= DELETE PRODUCT =================

const deleteProduct = async (req, res) => {

    try {

        const id = req.params.id;

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {

            return res.status(404).json({

                message: "Product not found"

            });

        }

        if (redisClient.isOpen) {

            await redisClient.del(`product:${id}`);

            const keys = await redisClient.keys("allproducts:*");

            if (keys.length) {

                await redisClient.del(keys);

            }

        }

        res.status(200).json({

            message: "Product Deleted Successfully"

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Failed to delete product"

        });

    }

};

// ================= ADD REVIEW =================

const addReview = async (req, res) => {

    try {

        const productId = req.params.id;

        const { rating, comment } = req.body;

        const userId = req.user.userId;
        const userName = req.user.name;

        const product = await Product.findById(productId);

        if (!product) {

            return res.status(404).json({
                message: "Product Not Found"
            });

        }

        // Check already reviewed

        const alreadyReviewed = product.reviews.find(

            r => r.user.toString() === userId

        );

        if (alreadyReviewed) {

            return res.status(400).json({

                message: "You already reviewed this product"

            });

        }

        const review = {

            user: userId,

            name: userName,

            rating: Number(rating),

            comment

        };

        product.reviews.push(review);

        product.numReviews = product.reviews.length;

        product.averageRating =

            product.reviews.reduce(

                (acc, item) => acc + item.rating,

                0

            ) / product.reviews.length;

        await product.save();

        res.status(201).json({

            success: true,

            message: "Review Added Successfully"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: err.message

        });

    }

};

module.exports = {

    getAllProducts,

    getSingleProduct,

    addNewProduct,

    updateProduct,

     addReview,

    getRelatedProducts,

   getRecommendedProducts,

    deleteProduct

};