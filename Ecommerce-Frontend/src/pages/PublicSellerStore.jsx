import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getPublicSellerStore,
  getPublicSellerProducts,
} from "../api/publicSellerApi";
import ProductCard from "../components/ProductCard";
import {
  FiBox,
  FiCheckCircle,
  FiArrowLeft,
  FiAlertCircle,
  FiShoppingBag,
} from "react-icons/fi";

export default function PublicSellerStore() {
  const { sellerId } = useParams();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const fetchStorefrontData = useCallback(async () => {
    if (!sellerId) return;

    try {
      setLoading(true);
      setError("");
      setNotFound(false);

      // Fetch seller info and products concurrently
      const [sellerRes, productsRes] = await Promise.all([
        getPublicSellerStore(sellerId),
        getPublicSellerProducts(sellerId),
      ]);

      if (sellerRes.seller) {
        setSeller(sellerRes.seller);
      } else {
        setNotFound(true);
      }

      if (productsRes.products) {
        setProducts(productsRes.products);
      }
    } catch (err) {
      console.error("Error loading public seller storefront:", err);
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load merchant store details"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchStorefrontData();
  }, [fetchStorefrontData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium text-sm">
          Loading storefront catalog...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <FiAlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Storefront Not Found
        </h1>
        <p className="text-gray-600 max-w-md mb-6 text-sm">
          The requested merchant store does not exist, is no longer active, or is pending verification.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded shadow-sm transition-colors"
        >
          <FiArrowLeft size={16} /> Return to Homepage
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchStorefrontData}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors"
          >
            <FiArrowLeft size={16} /> Back to Products
          </Link>
        </div>

        {/* Store Header Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-2xl font-bold shadow-md flex-shrink-0">
                📦
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {seller?.storeName || "Merchant Store"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <FiCheckCircle size={12} /> Verified Merchant
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Official Merchant Partner Storefront
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 self-start md:self-auto">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiBox size={20} />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">
                  Catalog Size
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {seller?.productCount !== undefined
                    ? seller.productCount
                    : products.length}{" "}
                  Active Products
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Catalog Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiShoppingBag className="text-amber-500" /> Merchant Products
          </h2>
          <span className="text-sm text-gray-500 font-medium">
            Showing {products.length} items
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            <FiBox size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">
              No Active Products
            </h3>
            <p className="text-sm text-gray-500">
              This merchant has not listed any active products for sale yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
