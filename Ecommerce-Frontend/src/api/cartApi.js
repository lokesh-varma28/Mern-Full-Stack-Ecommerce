
import API from "./axios";

// Get Cart
export const getCart = () => API.get("/cart");

// Add / Increase Quantity
export const increaseQuantity = (productId) =>
    API.post("/cart", { productId });

// Decrease Quantity
export const decreaseQuantity = (productId) =>
    API.put("/cart/decrease", { productId });

// Remove Item
export const removeCartItem = (productId) =>
    API.delete("/cart", {
        data: { productId }
    });

// Alias (ProductDetails.jsx already uses this)
export const addToCart = (productId) =>
    API.post("/cart", { productId });