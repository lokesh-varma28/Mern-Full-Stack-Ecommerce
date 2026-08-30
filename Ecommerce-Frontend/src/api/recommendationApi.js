import API from "./axios";

// GET /products/recommend/:id  →  { success, products }
export const getRecommendations = (id) =>
    API.get(`/products/recommend/${id}`);
