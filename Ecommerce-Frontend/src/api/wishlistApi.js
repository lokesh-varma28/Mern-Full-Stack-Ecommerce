import API from "./axios";

// GET WISHLIST
export const getWishlist = () => API.get("/wishlist");

// ADD TO WISHLIST
export const addToWishlist = (productId) =>
    API.post("/wishlist", {
        productId
    });

// REMOVE FROM WISHLIST
export const removeWishlist = (productId) =>
    API.delete(`/wishlist/${productId}`);