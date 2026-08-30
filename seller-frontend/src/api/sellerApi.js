import API from "./axios";

// ================= Authentication & Onboarding =================
export const loginSeller = (credentials) => API.post("/login", credentials);

export const registerSeller = (data) => API.post("/register", { ...data, role: "seller" });

export const applySeller = (data) => API.post("/seller/apply", data);

export const getProfile = () => API.get("/profile");

// ================= Seller Profile =================
export const getSellerProfile = () => API.get("/seller/profile");

export const updateSellerProfile = (data) => API.put("/seller/profile", data);

// ================= Seller Analytics & Customers =================
export const getSellerAnalytics = () => API.get("/seller/analytics");

export const getSellerCustomers = () => API.get("/seller/customers");

// ================= Seller Products =================
export const getSellerProducts = () => API.get("/seller/products");

export const createSellerProduct = (formData) =>
  API.post("/seller/products", formData);

export const updateSellerProduct = (id, formData) =>
  API.put(`/seller/products/${id}`, formData);

export const deleteSellerProduct = (id) =>
  API.delete(`/seller/products/${id}`);

// ================= Seller Orders =================
export const getSellerOrders = () => API.get("/seller/orders");

export const updateSellerItemStatus = (orderId, itemId, status) =>
  API.put(`/seller/orders/${orderId}/items/${itemId}/status`, { status });

