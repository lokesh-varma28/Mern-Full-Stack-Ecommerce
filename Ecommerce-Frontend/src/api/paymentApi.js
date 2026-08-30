import API from "./axios";

export const checkout = (data) =>
    API.post("/payment/checkout", data || {});

export const verifyPayment = (data) =>
    API.post("/payment/verify-payment", data);