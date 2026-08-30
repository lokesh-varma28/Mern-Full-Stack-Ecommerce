import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { getProfile, getSellerProfile } from "../api/sellerApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );

  const [loading, setLoading] = useState(true);
  const inFlightRefreshRef = useRef(null);

  // Sync token to localStorage
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const refreshPromise = (async () => {
      const currentToken = localStorage.getItem("token") || token;
      if (!currentToken) {
        setLoading(false);
        return null;
      }

      try {
        let currentUser = user;
        if (!currentUser) {
          try {
            currentUser = JSON.parse(localStorage.getItem("user")) || null;
          } catch {
            currentUser = null;
          }
        }

        let updatedData = null;

        // Pending or rejected sellers must NOT access seller-protected APIs (/seller/profile)
        if (
          currentUser &&
          currentUser.role === "seller" &&
          currentUser.sellerStatus !== "approved"
        ) {
          const res = await getProfile();
          if (res.data && res.data.user) {
            updatedData = res.data.user;
          }
        } else if (
          currentUser &&
          currentUser.role === "seller" &&
          currentUser.sellerStatus === "approved"
        ) {
          try {
            const res = await getSellerProfile();
            if (res.data && res.data.seller) {
              updatedData = res.data.seller;
            }
          } catch (err) {
            // Gracefully handle 403 or authorization changes by falling back to getProfile
            if (err.response && err.response.status === 403) {
              const res = await getProfile();
              if (res.data && res.data.user) {
                updatedData = res.data.user;
              }
            } else {
              throw err;
            }
          }
        } else {
          // Unknown or uninitialized user state: start with getProfile
          const res = await getProfile();
          if (res.data && res.data.user) {
            updatedData = res.data.user;
            if (
              updatedData.role === "seller" &&
              updatedData.sellerStatus === "approved"
            ) {
              try {
                const sellerRes = await getSellerProfile();
                if (sellerRes.data && sellerRes.data.seller) {
                  updatedData = { ...updatedData, ...sellerRes.data.seller };
                }
              } catch {
                // Ignore fallback error if getProfile already succeeded
              }
            }
          }
        }

        if (updatedData) {
          setUser((prev) => ({ ...prev, ...updatedData }));
          return updatedData;
        }
        return null;
      } catch (err) {
        console.error("Failed to refresh user profile:", err);
        return null;
      } finally {
        setLoading(false);
        inFlightRefreshRef.current = null;
      }
    })();

    inFlightRefreshRef.current = refreshPromise;
    return refreshPromise;
  }, [token, user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const isSeller = user?.role === "seller";
  const sellerStatus = user?.sellerStatus || "pending";
  const isApprovedSeller = isSeller && sellerStatus === "approved";
  const isPendingSeller = isSeller && sellerStatus === "pending";
  const isRejectedSeller = isSeller && sellerStatus === "rejected";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isSeller,
        sellerStatus,
        isApprovedSeller,
        isPendingSeller,
        isRejectedSeller,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

