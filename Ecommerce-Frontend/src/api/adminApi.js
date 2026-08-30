import API from "./axios";

// ================= Dashboard =================

export const getDashboard = () =>
    API.get("/admin/dashboard");

// ================= Sales Analytics =================

export const getSalesAnalytics = () =>
    API.get("/admin/sales");

// ================= Top Products =================

export const getTopProducts = () =>
    API.get("/admin/top-products");

// ================= Users =================

export const getUsers = () =>
    API.get("/admin/users");

export const deleteUser = (id) =>
    API.delete(`/admin/user/${id}`);

// ================= Orders =================

export const getOrders = () =>
    API.get("/admin/orders");

export const updateOrderStatus = (id, status) =>
    API.put(`/admin/order/${id}/status`, { status });

// ================= Products =================

export const getProducts = () =>
    API.get("/admin/products");

export const addProduct = (data) =>
    API.post("/admin/product", data);

export const editProduct = (id, data) =>
    API.put(`/admin/product/${id}`, data);

export const deleteProduct = (id) =>
    API.delete(`/admin/product/${id}`);

// ================= Coupons =================

export const getCoupons = () =>
    API.get("/coupon");

export const addCoupon = (data) =>
    API.post("/coupon/coupon", data);

export const updateCoupon = (id, data) =>
    API.put(`/coupon/coupon/${id}`, data);

export const deleteCoupon = (id) =>
    API.delete(`/coupon/coupon/${id}`);


// ================= Tracking =================

export const assignTracking = (id, data) =>
    API.put(`/admin/order/${id}/tracking`, data);

// ================= Sellers =================

export const getAdminSellers = (params) =>
    API.get("/admin/sellers", { params });

export const approveSeller = (id) =>
    API.put(`/admin/sellers/${id}/approve`);

export const rejectSeller = (id) =>
    API.put(`/admin/sellers/${id}/reject`);