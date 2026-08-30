import API from "./axios";

// GET /seller/products
export const getSellerProducts = async () => {
  const response = await API.get("/seller/products");
  return response.data;
};

// POST /seller/products (supports FormData for image uploads)
export const createSellerProduct = async (formData) => {
  const response = await API.post("/seller/products", formData);
  return response.data;
};

// PUT /seller/products/:id (supports FormData for image uploads)
export const updateSellerProduct = async (id, formData) => {
  const response = await API.put(`/seller/products/${id}`, formData);
  return response.data;
};

// DELETE /seller/products/:id
export const deleteSellerProduct = async (id) => {
  const response = await API.delete(`/seller/products/${id}`);
  return response.data;
};

// GET /seller/orders
export const getSellerOrders = async () => {
  const response = await API.get("/seller/orders");
  return response.data;
};

// PUT /seller/orders/:orderId/items/:itemId/status
export const updateSellerItemStatus = async (orderId, itemId, status) => {
  const response = await API.put(`/seller/orders/${orderId}/items/${itemId}/status`, {
    status,
  });
  return response.data;
};

// GET /seller/analytics
export const getSellerAnalytics = async () => {
  const response = await API.get("/seller/analytics");
  return response.data;
};

// POST /seller/apply
export const applySeller = async (data) => {
  const response = await API.post("/seller/apply", data);
  return response.data;
};

// GET /seller/application
export const getSellerApplication = async () => {
  const response = await API.get("/seller/application");
  return response.data;
};

// GET /seller/profile
export const getSellerProfile = async () => {
  const response = await API.get("/seller/profile");
  return response.data;
};

// PUT /seller/profile
export const updateSellerProfile = async (profileData) => {
  const response = await API.put("/seller/profile", profileData);
  return response.data;
};

