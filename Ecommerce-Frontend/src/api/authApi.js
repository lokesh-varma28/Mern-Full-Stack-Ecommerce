import API from "./axios";

// ── Standard email / password auth ────────────────────────────────────────
export const registerUser    = (data) => API.post("/register",       data);
export const loginUser       = (data) => API.post("/login",          data);
export const verifyOtp       = (data) => API.post("/verify-otp",     data);
export const resendOtp       = (data) => API.post("/resend-otp",     data);
export const forgotPassword  = (data) => API.post("/forgot-password",data);
export const resetPassword   = (data) => API.post("/reset-password", data);
export const refreshToken    = (data) => API.post("/refresh-token",  data);

// ── Profile ───────────────────────────────────────────────────────────────
export const getProfile      = ()     => API.get("/profile");
export const updateProfile   = (data) => API.put("/update-profile",  data);
export const uploadAvatar    = (formData) => API.post("/profile/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const uploadCover     = (formData) => API.post("/profile/cover",  formData, { headers: { "Content-Type": "multipart/form-data" } });


// ── Google OAuth ──────────────────────────────────────────────────────────
// credential = Google id_token string returned by @react-oauth/google
export const googleLogin     = (credential) =>
    API.post("/auth/google", { credential });
