import API from "./axios";

// GET /sellers/:sellerId
export const getPublicSellerStore = async (sellerId) => {
  const response = await API.get(`/sellers/${sellerId}`);
  return response.data;
};

// GET /sellers/:sellerId/products
export const getPublicSellerProducts = async (sellerId, params = {}) => {
  const response = await API.get(`/sellers/${sellerId}/products`, { params });
  return response.data;
};
