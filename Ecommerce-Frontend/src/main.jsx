import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import "./index.css";
import { CompareProvider } from "./context/CompareContext";
import { AuthProvider }    from "./context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <CompareProvider>
                    <App />
                </CompareProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
