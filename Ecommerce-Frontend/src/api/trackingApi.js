import API from "./axios";

export const trackOrder = (id) => API.get(`/track/${id}`);