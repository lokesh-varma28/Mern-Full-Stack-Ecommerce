const Product = require("../Model/ProductModel");

const searchProducts = async (req, res) => {
    try {

        const {
            q,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 10
        } = req.query;

        let filter = {};

        // Search
        if (q) {
            filter.title = {
                $regex: q,
                $options: "i"
            };
        }

        // Price Filter
        if (minPrice || maxPrice) {

            filter.price = {};

            if (minPrice)
                filter.price.$gte = Number(minPrice);

            if (maxPrice)
                filter.price.$lte = Number(maxPrice);
        }

        let sortOption = {};

        if (sort === "low")
            sortOption.price = 1;

        else if (sort === "high")
            sortOption.price = -1;

        else if (sort === "latest")
            sortOption.createdAt = -1;

        const skip = (page - 1) * limit;

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(filter);

        res.json({
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            products
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    searchProducts
};