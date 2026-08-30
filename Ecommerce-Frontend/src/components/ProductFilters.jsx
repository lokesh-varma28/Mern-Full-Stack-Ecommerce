import { useState } from "react";

export default function ProductFilters({ onFilter }) {

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const applyFilters = () => {

        onFilter({
            keyword,
            category,
            brand,
            minPrice,
            maxPrice
        });

    };

    const clearFilters = () => {

        setKeyword("");
        setCategory("");
        setBrand("");
        setMinPrice("");
        setMaxPrice("");

        onFilter({
            keyword: "",
            category: "",
            brand: "",
            minPrice: "",
            maxPrice: ""
        });

    };

    return (

        <div className="bg-white shadow rounded-lg p-5">

            <h2 className="text-2xl font-bold mb-5">
                Filters
            </h2>

            {/* Search */}

            <input
                type="text"
                placeholder="Search Product..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="border p-2 rounded w-full mb-4"
            />

            {/* Category */}

            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border p-2 rounded w-full mb-4"
            >

                <option value="">All Categories</option>

                <option value="Mobiles">Mobiles</option>

                <option value="Laptops">Laptops</option>

                <option value="Fashion">Fashion</option>

                <option value="Electronics">Electronics</option>

                <option value="Books">Books</option>

            </select>

            {/* Brand */}

            <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="border p-2 rounded w-full mb-4"
            >

                <option value="">All Brands</option>

                <option value="Apple">Apple</option>

                <option value="Samsung">Samsung</option>

                <option value="Sony">Sony</option>

                <option value="Nike">Nike</option>

                <option value="HP">HP</option>

            </select>

            {/* Min Price */}
            <select
                value={minPrice}
                onChange={(e) => {
                    const val = e.target.value;
                    setMinPrice(val);
                    if (maxPrice && val && Number(val) > Number(maxPrice)) {
                        setMaxPrice("");
                    }
                }}
                className="border p-2 rounded w-full mb-4"
            >
                <option value="">No Minimum (Min Price)</option>
                <option value="0">₹0</option>
                <option value="500">₹500</option>
                <option value="1000">₹1,000</option>
                <option value="2500">₹2,500</option>
                <option value="5000">₹5,000</option>
                <option value="10000">₹10,000</option>
                <option value="25000">₹25,000</option>
            </select>

            {/* Max Price */}
            <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="border p-2 rounded w-full mb-5"
            >
                <option value="">No Maximum (Max Price)</option>
                <option value="500" disabled={Boolean(minPrice && Number(minPrice) > 500)}>₹500</option>
                <option value="1000" disabled={Boolean(minPrice && Number(minPrice) > 1000)}>₹1,000</option>
                <option value="2500" disabled={Boolean(minPrice && Number(minPrice) > 2500)}>₹2,500</option>
                <option value="5000" disabled={Boolean(minPrice && Number(minPrice) > 5000)}>₹5,000</option>
                <option value="10000" disabled={Boolean(minPrice && Number(minPrice) > 10000)}>₹10,000</option>
                <option value="25000" disabled={Boolean(minPrice && Number(minPrice) > 25000)}>₹25,000</option>
                <option value="50000" disabled={Boolean(minPrice && Number(minPrice) > 50000)}>₹50,000+</option>
            </select>

            <button
                onClick={applyFilters}
                className="w-full bg-yellow-400 hover:bg-yellow-500 py-2 rounded font-bold"
            >
                Apply Filters
            </button>

            <button
                onClick={clearFilters}
                className="w-full bg-gray-300 hover:bg-gray-400 py-2 rounded mt-3"
            >
                Clear Filters
            </button>

        </div>

    );

}