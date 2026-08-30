import API from "./axios";

export const downloadInvoice = (id) =>
    API.get(`/invoice/${id}`, {
        responseType: "blob"
    });