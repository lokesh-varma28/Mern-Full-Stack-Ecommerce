const express = require("express");
const router  = express.Router();
const { googleLogin } = require("../Controller/googleAuthController");

// GET /auth/google/ping  →  health check (no auth needed)
router.get("/google/ping", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const configured = clientId && clientId !== "your_google_client_id_here" && clientId !== "PASTE_YOUR_CLIENT_ID_HERE";
    res.json({
        status:     "ok",
        route:      "POST /auth/google  →  Google OAuth endpoint is live",
        configured: configured ? "✅ GOOGLE_CLIENT_ID is set" : "❌ GOOGLE_CLIENT_ID is NOT set in .env",
    });
});

// POST /auth/google  →  verify Google id_token, return JWT
router.post("/google", googleLogin);

module.exports = router;
