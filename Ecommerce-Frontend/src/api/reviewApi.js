import API from "./axios";

// Get Reviews
export const getReviews = (productId) =>
    API.get(`/review/${productId}`);

// Add Review
export const addReview = (formData) =>
    API.post("/review", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

// Update Review
export const updateReview = (id, data) =>
    API.put(`/review/${id}`, data);

// Delete Review
export const deleteReview = (id) =>
    API.delete(`/review/${id}`);