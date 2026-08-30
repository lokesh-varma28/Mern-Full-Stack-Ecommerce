import API from "./axios";

export const getAddresses = () => API.get("/address");

export const addAddress = (data) =>
    API.post("/address", data);

export const updateAddress = (id, data) =>
    API.put(`/address/${id}`, data);

export const deleteAddress = (id) =>
    API.delete(`/address/${id}`);