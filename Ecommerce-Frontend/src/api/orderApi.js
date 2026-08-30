import API from "./axios";

// Get all orders
export const getOrders = () =>
    API.get("/orders");

// Place new order
export const placeOrder = (data) =>
    API.post("/orders", data);

export const placeCodOrder = (data) =>
    API.post("/payment/cod", data);

// Get single order
export const getSingleOrder = (id) =>
    API.get(`/orders/${id}`);

// Cancel order
export const cancelOrder = (id) =>
    API.put(`/orders/${id}/cancel`);

// Track order
export const trackOrder = (id) =>
    API.get(`/track/${id}`);

// DOWLOAD INVOICE
export const downloadInvoice = (id) =>
    API.get(`/orders/${id}/invoice`, {
        responseType: "blob"
    });

    