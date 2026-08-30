// import API from "./axios";

// // Submit Return Request
// export const requestReturn = (data) =>
//     API.post("/return", data);

// // My Returns
// export const getMyReturns = () =>
//     API.get("/return/my");

// // Admin Returns
// export const getAllReturns = () =>
//     API.get("/admin/returns");

// // Update Status
// export const updateReturnStatus = (id, data) =>
//     API.put(`/admin/returns/${id}`, data);
import API from "./axios";

// User submits return request
export const requestReturn = (data) =>
    API.post("/return", data);

// User can view own return requests
export const getMyReturns = () =>
    API.get("/return/my");

// Admin gets all return requests
export const getAllReturns = () =>
    API.get("/admin/returns");

// Admin updates return status
export const updateReturnStatus = (id, status) =>
    API.put(`/admin/returns/${id}`, {
        status
    });