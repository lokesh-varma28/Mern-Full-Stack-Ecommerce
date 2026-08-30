const { OAuth2Client } = require("google-auth-library");
const User = require("../Model/UserModel");
const { generateAccessToken, generateRefreshToken } = require("../helper/token");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =============================================
// POST /auth/google
// Body: { credential }  – Google access_token from frontend
// =============================================
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" });
        }

        // ── Verify access_token via Google's tokeninfo endpoint ──
        // This works for both access_tokens (implicit flow) and id_tokens.
        let googleUser;

        try {
            // First try: treat as access_token → call userinfo
            const userInfoRes = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                { headers: { Authorization: `Bearer ${credential}` } }
            );

            if (userInfoRes.ok) {
                googleUser = await userInfoRes.json();
            } else {
                // Second try: treat as id_token → verify with OAuth2Client
                const ticket = await client.verifyIdToken({
                    idToken:  credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                googleUser = ticket.getPayload();
            }
        } catch {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        const { sub: googleId, email, name, picture } = googleUser;

        if (!email) {
            return res.status(400).json({ message: "Google account has no email address" });
        }

        // ── Find or create user ──
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Link Google to existing account if not yet linked
            if (!user.googleId) {
                user.googleId     = googleId;
                user.authProvider = "google";
                user.avatar       = user.avatar || picture;
                user.isVerified   = true;
                await user.save();
            }
        } else {
            // Brand new user via Google
            user = await User.create({
                name,
                email,
                googleId,
                avatar:       picture || null,
                authProvider: "google",
                isVerified:   true,
                password:     null,
            });
        }

        // ── Issue JWT — same shape as regular login ──
        const accessToken  = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.status(200).json({
            message:      "Google login successful",
            token:        accessToken,
            refreshToken,
            user: {
                _id:    user._id,
                name:   user.name,
                email:  user.email,
                role:   user.role,
                avatar: user.avatar,
            },
        });

    } catch (error) {
        console.error("Google auth error:", error.message);
        return res.status(500).json({ message: "Google authentication failed" });
    }
};

module.exports = { googleLogin };
