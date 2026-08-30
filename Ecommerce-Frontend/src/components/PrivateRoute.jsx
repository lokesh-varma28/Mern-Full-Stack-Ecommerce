import { Navigate, useLocation } from "react-router-dom";

/**
 * Wraps any route that requires an authenticated user.
 * Redirects to /login and preserves the attempted URL so
 * the user is sent back after logging in.
 */
export default function PrivateRoute({ children }) {
    const token = localStorage.getItem("token");
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
