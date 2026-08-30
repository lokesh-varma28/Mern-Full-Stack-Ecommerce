import API from "./axios";

// GET /products  →  { total, page, limit, totalPages, products }
export const getAllProducts = (params) => API.get("/products", { params });

// GET /products/:id  →  { singleProduct }
export const getSingleProduct = (id) => API.get(`/products/${id}`);

// GET /products/related/:id  →  [ ...products ]
export const getRelatedProducts = (id) => API.get(`/products/related/${id}`);

// GET /products/recommend/:id  →  { success, products }
export const getRecommendedProducts = (id) => API.get(`/products/recommend/${id}`);
