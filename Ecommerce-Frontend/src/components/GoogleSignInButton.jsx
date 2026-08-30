import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import "./GoogleSignInButton.css";

/**
 * Custom Google Sign-In button.
 * Uses AuthContext.login() so Navbar and all other consumers
 * reactively update immediately after sign-in — no page reload needed.
 */
export default function GoogleSignInButton({ onSuccess, onError }) {
    const { login } = useAuth();

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            // Send access_token to backend → backend verifies with Google
            const res = await googleLogin(tokenResponse.access_token);
            const { token, user } = res.data;

            // ✅ Use AuthContext — updates all consumers instantly
            login(user, token);

            onSuccess?.(user, token);
        } catch (err) {
            const msg = err.response?.data?.message || "Google sign-in failed. Try again.";
            onError?.(msg);
        }
    };

    const startLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError:   () => onError?.("Google sign-in was cancelled or failed"),
        flow:      "implicit",
    });

    return (
        <div className="gsi-wrap">
            <div className="gsi-divider">
                <span className="gsi-divider-text">or</span>
            </div>
            <button
                type="button"
                onClick={() => startLogin()}
                className="gsi-btn"
                aria-label="Continue with Google"
            >
                <svg className="gsi-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="gsi-btn-text">Continue with Google</span>
            </button>
        </div>
    );
}
