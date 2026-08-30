import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import HeroSlider from "../components/HeroSlider";
import Categories from "../components/Categories";
import ProductCard from "../components/ProductCard";
import "./Home.css";

const SORT_OPTIONS = [
    { value: "",          label: "Relevance" },
    { value: "priceLow",  label: "Price: Low to High" },
    { value: "priceHigh", label: "Price: High to Low" },
    { value: "rating",    label: "Avg. Customer Review" },
    { value: "newest",    label: "Newest Arrivals" },
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

export default function Home() {
    const [searchParams]                    = useSearchParams();
    const [products, setProducts]           = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading]             = useState(true);

    // Filters
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword,  setKeyword]          = useState("");
    const [category, setCategory]         = useState("");
    const [brand,    setBrand]            = useState("");
    const [minPrice, setMinPrice]         = useState("");
    const [maxPrice, setMaxPrice]         = useState("");
    const [sort,     setSort]             = useState("");

    // Debounce keywordInput updates to keyword API state by 350ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setKeyword(keywordInput);
        }, 350);
        return () => clearTimeout(timer);
    }, [keywordInput]);

    // Sync URL search params on mount or change
    useEffect(() => {
        const cat = searchParams.get("category");
        if (cat) setCategory(cat);
        const kw = searchParams.get("keyword");
        if (kw) {
            setKeywordInput(kw);
            setKeyword(kw);
        }
        const b = searchParams.get("brand");
        if (b) setBrand(b);
    }, [searchParams]);

    // Categories list derived dynamically from real app categories + products dataset
    const availableCategories = useMemo(() => {
        const defaultCats = [
            "Mobiles", "Laptops", "Electronics", "Fashion", "Home & Kitchen",
            "Books", "Sports", "Beauty", "Grocery", "Toys"
        ];
        const fromProds = products.map((p) => p.category).filter(Boolean);
        const set = new Set([...defaultCats, ...fromProds]);
        return Array.from(set).sort();
    }, [products]);

    // Brands list derived dynamically from real app brands + products dataset
    const availableBrands = useMemo(() => {
        const defaultBrands = [
            "Apple", "Samsung", "Sony", "Nike", "HP", "Dell", "Adidas", "Puma", "LG", "boAt", "OnePlus"
        ];
        const fromProds = products.map((p) => p.brand).filter(Boolean);
        const set = new Set([...defaultBrands, ...fromProds]);
        return Array.from(set).sort();
    }, [products]);

    // Fetch products with stale request race condition prevention
    useEffect(() => {
        let isCurrent = true;

        const loadProducts = async () => {
            try {
                setLoading(true);
                const params = { page, limit: 100, sort };
                if (keyword)  params.keyword  = keyword;
                if (category) params.category = category;
                if (brand)    params.brand    = brand;
                if (minPrice) params.minPrice = minPrice;
                if (maxPrice) params.maxPrice = maxPrice;

                const res = await API.get("/products", { params });
                if (isCurrent) {
                    setProducts(res.data.products || []);
                    setTotalPages(res.data.totalPages || 1);
                    setTotalProducts(res.data.total || res.data.products?.length || 0);
                }
            } catch (err) {
                if (isCurrent) {
                    console.error("Failed to fetch products:", err);
                    setProducts([]);
                }
            } finally {
                if (isCurrent) {
                    setLoading(false);
                }
            }
        };

        loadProducts();

        return () => {
            isCurrent = false;
        };
    }, [page, keyword, category, brand, minPrice, maxPrice, sort]);

    // Load recently viewed from localStorage
    useEffect(() => {
        const recent = JSON.parse(localStorage.getItem("recentProducts")) || [];
        setRecentProducts(recent);
    }, []);

    // Reset to page 1 when filters change
    const handleFilterChange = (setter) => (e) => {
        setPage(1);
        setter(e.target.value);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const hasActiveFilters = Boolean(
        keywordInput || category || brand || minPrice || maxPrice || sort
    );

    const clearAllFilters = () => {
        setKeywordInput("");
        setKeyword("");
        setCategory("");
        setBrand("");
        setMinPrice("");
        setMaxPrice("");
        setSort("");
        setPage(1);
    };

    // Pagination window: show max 5 page buttons
    const getPaginationRange = () => {
        const delta = 2;
        const range = [];
        const left  = Math.max(1, page - delta);
        const right = Math.min(totalPages, page + delta);
        for (let i = left; i <= right; i++) range.push(i);
        return range;
    };

    return (
        <div className="home-page">

            {/* ── Hero Banner ── */}
            <HeroSlider />

            {/* ── Shop by Category ── */}
            <Categories />

            {/* ── Main content ── */}
            <div className="home-inner">

                {/* ── Filter Bar ── */}
                <div className="home-filter-bar">
                    {/* 1. Keyword */}
                    <div className="home-filter-group">
                        <label className="home-filter-label">Keyword</label>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={keywordInput}
                            onChange={(e) => {
                                setPage(1);
                                setKeywordInput(e.target.value);
                            }}
                            className="home-filter-input"
                            aria-label="Search products..."
                        />
                    </div>

                    {/* 2. Category */}
                    <div className="home-filter-group">
                        <label className="home-filter-label">Category</label>
                        <select
                            value={category}
                            onChange={handleFilterChange(setCategory)}
                            className="home-filter-select"
                            aria-label="Filter by category"
                        >
                            <option value="">All Categories</option>
                            {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Brand */}
                    <div className="home-filter-group">
                        <label className="home-filter-label">Brand</label>
                        <select
                            value={brand}
                            onChange={handleFilterChange(setBrand)}
                            className="home-filter-select"
                            aria-label="Filter by brand"
                        >
                            <option value="">All Brands</option>
                            {availableBrands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Min Price (₹) */}
                    <div className="home-filter-group">
                        <label className="home-filter-label">Min Price (₹)</label>
                        <select
                            value={minPrice}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPage(1);
                                setMinPrice(val);
                                if (maxPrice && val && Number(val) > Number(maxPrice)) {
                                    setMaxPrice("");
                                }
                            }}
                            className="home-filter-select"
                            aria-label="Minimum price"
                        >
                            {MIN_PRICE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 5. Max Price (₹) */}
                    <div className="home-filter-group">
                        <label className="home-filter-label">Max Price (₹)</label>
                        <select
                            value={maxPrice}
                            onChange={(e) => {
                                setPage(1);
                                setMaxPrice(e.target.value);
                            }}
                            className="home-filter-select"
                            aria-label="Maximum price"
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

                    {/* 6. Sort By */}
                    <div className="home-filter-group">
                        <label className="home-filter-label">Sort By</label>
                        <select
                            value={sort}
                            onChange={handleFilterChange(setSort)}
                            className="home-filter-select"
                            aria-label="Sort products"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 7. Clear Filters Action */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="home-filter-clear-btn"
                            aria-label="Clear all active filters"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* ── Section header ── */}
                <div className="home-section-header">
                    <h1 className="home-section-title">
                        {keyword || category || brand || minPrice || maxPrice
                            ? "Results"
                            : "All Products"}
                    </h1>
                    {!loading && (
                        <p className="home-result-count">
                            {totalProducts} product{totalProducts !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>

                {/* ── Products ── */}
                {loading ? (
                    <div className="home-loading">
                        <div className="home-spinner" />
                        <p>Loading products…</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="home-empty">
                        <p className="home-empty-title">No results for your search.</p>
                        <p className="home-empty-sub">
                            Try adjusting your filters or search with a different keyword.
                        </p>
                    </div>
                ) : (
                    <div className="home-product-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className="home-pagination">
                        <button
                            className="home-page-btn"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                            aria-label="Previous page"
                        >
                            ← Previous
                        </button>

                        {getPaginationRange().map((p) => (
                            <button
                                key={p}
                                className={`home-page-btn ${p === page ? "home-page-btn--active" : ""}`}
                                onClick={() => handlePageChange(p)}
                                aria-label={`Page ${p}`}
                                aria-current={p === page ? "page" : undefined}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            className="home-page-btn"
                            disabled={page === totalPages}
                            onClick={() => handlePageChange(page + 1)}
                            aria-label="Next page"
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* ── Recently Viewed ── */}
                {recentProducts.length > 0 && (
                    <div className="home-recent">
                        <h2 className="home-recent-title">Your Recently Viewed Items</h2>
                        <div className="home-product-grid">
                            {recentProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
