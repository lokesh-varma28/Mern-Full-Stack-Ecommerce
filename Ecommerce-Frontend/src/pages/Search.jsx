import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";
import "./Search.css";

const SORT_OPTIONS = [
    { value: "", label: "Relevance" },
    { value: "priceLow", label: "Price: Low to High" },
    { value: "priceHigh", label: "Price: High to Low" },
    { value: "rating", label: "Avg. Customer Review" },
    { value: "newest", label: "Newest Arrivals" },
];

const MIN_PRICE_OPTIONS = [
    { value: "", label: "No Minimum" },
    { value: "0", label: "₹0" },
    { value: "500", label: "₹500" },
    { value: "1000", label: "₹1,000" },
    { value: "2500", label: "₹2,500" },
    { value: "5000", label: "₹5,000" },
    { value: "10000", label: "₹10,000" },
    { value: "25000", label: "₹25,000" },
    { value: "50000", label: "₹50,000" },
];

const MAX_PRICE_OPTIONS = [
    { value: "", label: "No Maximum" },
    { value: "500", label: "₹500" },
    { value: "1000", label: "₹1,000" },
    { value: "2500", label: "₹2,500" },
    { value: "5000", label: "₹5,000" },
    { value: "10000", label: "₹10,000" },
    { value: "25000", label: "₹25,000" },
    { value: "50000", label: "₹50,000" },
];

export default function Search() {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [brand, setBrand] = useState("");

    const availableBrands = useMemo(() => {
        const defaultBrands = [
            "Apple", "Samsung", "Sony", "Nike", "HP", "Dell", "Adidas", "Puma", "LG", "boAt", "OnePlus"
        ];
        const fromProds = products.map((p) => p.brand).filter(Boolean);
        const set = new Set([...defaultBrands, ...fromProds]);
        return Array.from(set).sort();
    }, [products]);

    useEffect(() => {
        let isCurrent = true;

        const executeSearch = async () => {
            try {
                setLoading(true);
                const params = { limit: 100 };
                if (keyword) params.keyword = keyword;
                if (category) params.category = category;
                if (sort) params.sort = sort;
                if (minPrice) params.minPrice = minPrice;
                if (maxPrice) params.maxPrice = maxPrice;
                if (brand) params.brand = brand;

                const res = await API.get("/products", { params });
                if (isCurrent) {
                    setProducts(res.data.products || []);
                }
            } catch (err) {
                if (isCurrent) {
                    console.error(err);
                    setProducts([]);
                }
            } finally {
                if (isCurrent) {
                    setLoading(false);
                }
            }
        };

        executeSearch();

        return () => {
            isCurrent = false;
        };
    }, [keyword, category, sort, minPrice, maxPrice, brand]);

    const clearFilters = () => {
        setSort("");
        setMinPrice("");
        setMaxPrice("");
        setBrand("");
    };

    const hasFilters = sort || minPrice || maxPrice || brand;

    return (
        <div className="search-page">
            <div className="search-inner">
                {/* ── Header ── */}
                <div className="search-header">
                    <div>
                        <h1 className="search-title">
                            {keyword || category ? (
                                <>
                                    Search Results {keyword && (
                                        <>for <span className="search-keyword">"{keyword}"</span></>
                                    )}
                                    {category && (
                                        <span className="search-category"> in {category}</span>
                                    )}
                                </>
                            ) : (
                                "Search Products"
                            )}
                        </h1>
                        {!loading && (
                            <p className="search-count">
                                {products.length} result{products.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                    {(keyword || category) && (
                        <Link to="/" className="search-back-btn">
                            ← Back to Home
                        </Link>
                    )}
                </div>

                {/* ── Filter Bar ── */}
                <div className="search-filter-bar">
                    <div className="search-filter-group">
                        <label className="search-filter-label">Sort By</label>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="search-filter-select"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="search-filter-group">
                        <label className="search-filter-label">Brand</label>
                        <select
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="search-filter-select"
                        >
                            <option value="">All Brands</option>
                            {availableBrands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="search-filter-group">
                        <label className="search-filter-label">Min Price (₹)</label>
                        <select
                            value={minPrice}
                            onChange={(e) => {
                                const val = e.target.value;
                                setMinPrice(val);
                                if (maxPrice && val && Number(val) > Number(maxPrice)) {
                                    setMaxPrice("");
                                }
                            }}
                            className="search-filter-select"
                        >
                            {MIN_PRICE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="search-filter-group">
                        <label className="search-filter-label">Max Price (₹)</label>
                        <select
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="search-filter-select"
                        >
                            {MAX_PRICE_OPTIONS.map((opt) => {
                                const isDisabled =
                                    minPrice !== "" &&
                                    opt.value !== "" &&
                                    Number(opt.value) < Number(minPrice);
                                return (
                                    <option key={opt.value} value={opt.value} disabled={isDisabled}>
                                        {opt.label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {hasFilters && (
                        <button onClick={clearFilters} className="search-clear-btn">
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* ── Results ── */}
                {loading ? (
                    <div className="search-loading">
                        <div className="search-spinner" />
                        <p>Searching…</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="search-empty">
                        <div className="search-empty-icon">🔍</div>
                        <h2 className="search-empty-title">No results found</h2>
                        <p className="search-empty-sub">
                            {keyword || category ? (
                                <>
                                    We couldn't find any products matching your search.
                                    Try adjusting your filters or search with different keywords.
                                </>
                            ) : (
                                "Start searching for products by entering keywords in the search bar above."
                            )}
                        </p>
                        <Link to="/" className="search-empty-btn">
                            Browse All Products
                        </Link>
                    </div>
                ) : (
                    <div className="search-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
