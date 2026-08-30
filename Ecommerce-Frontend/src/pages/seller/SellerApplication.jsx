import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { applySeller, getSellerApplication } from "../../api/sellerApi";
import { useAuth } from "../../context/AuthContext";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSend,
  FiArrowLeft,
  FiShoppingBag,
  FiPhone,
  FiMapPin
} from "react-icons/fi";
import "./Seller.css";

export default function SellerApplication() {
  const { user, updateUser, refreshUser } = useAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    storeName: "",
    phone: "",
    businessAddress: "",
  });

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      if (refreshUser) await refreshUser();
      const res = await getSellerApplication();
      const appData = res.application || null;
      setApplication(appData);

      if (appData) {
        setForm({
          storeName: appData.storeName || "",
          phone: appData.phone || "",
          businessAddress: appData.businessAddress || "",
        });
        if (appData.sellerStatus !== undefined) {
          updateUser({
            role: appData.role,
            sellerStatus: appData.sellerStatus,
            storeName: appData.storeName,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching seller application:", err);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, updateUser]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.storeName.trim()) return setErrorMsg("Store Name is required");
    if (!phoneRegexTest(form.phone)) return setErrorMsg("Valid phone number is required");
    if (!form.businessAddress.trim()) return setErrorMsg("Business Address is required");

    try {
      setIsSubmitting(true);
      const res = await applySeller({
        storeName: form.storeName.trim(),
        phone: form.phone.trim(),
        businessAddress: form.businessAddress.trim(),
      });

      setSuccessMsg("Seller application submitted successfully!");
      if (res.application) {
        setApplication(res.application);
        updateUser({
          role: "seller",
          sellerStatus: "pending",
          storeName: res.application.storeName,
        });
      }
    } catch (err) {
      console.error("Error applying for seller account:", err);
      setErrorMsg(err.response?.data?.message || "Failed to submit seller application");
    } finally {
      setIsSubmitting(false);
    }
  };

  function phoneRegexTest(ph) {
    return ph && ph.trim().length >= 8;
  }

  if (loading) {
    return (
      <div className="seller-page-loading" style={{ minHeight: "80vh" }}>
        <div className="seller-spinner"></div>
        <p>Checking seller status...</p>
      </div>
    );
  }

  const currentStatus = application?.sellerStatus || user?.sellerStatus;

  return (
    <div className="seller-portal-container" style={{ justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link to="/" className="back-link">
            <FiArrowLeft size={16} /> Back to Store
          </Link>
          <h1 className="seller-page-title" style={{ fontSize: "2rem" }}>Merchant Partner Portal</h1>
          <p className="seller-page-subtitle">Join as a seller to list products and fulfill customer orders.</p>
        </div>

        {errorMsg && (
          <div className="seller-error-banner" style={{ marginBottom: "20px" }}>
            <FiXCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="seller-info-banner" style={{ backgroundColor: "#d1fae5", borderColor: "#6ee7b7", color: "#065f46", marginBottom: "20px" }}>
            <FiCheckCircle size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Status: APPROVED */}
        {currentStatus === "approved" && (
          <div className="seller-form-card" style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ fontSize: "3.5rem", color: "#059669", marginBottom: "16px" }}>
              <FiCheckCircle size={56} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: "0 0 8px" }}>Seller Account Approved!</h2>
            <p style={{ color: "#4b5563", marginBottom: "24px" }}>
              Your seller application for <strong>"{application?.storeName || user?.storeName}"</strong> has been approved by admin. You now have full access to your merchant dashboard and product management.
            </p>
            <Link to="/seller/dashboard" className="seller-primary-btn" style={{ justifyContent: "center", padding: "12px 24px", fontSize: "1rem" }}>
              Access Seller Dashboard
            </Link>
          </div>
        )}

        {/* Status: PENDING */}
        {currentStatus === "pending" && (
          <div className="seller-form-card" style={{ padding: "32px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "16px", backgroundColor: "#fffbe6", border: "1px solid #ffe58f", borderRadius: "8px", color: "#d48806" }}>
              <FiClock size={28} style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>Application Pending Approval</h3>
                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                  Your seller application is currently pending admin review. You will receive seller portal access once an administrator approves your store.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "20px", border: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "#374151" }}>Submitted Merchant Details</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.875rem", color: "#4b5563" }}>
                <div><strong>Store Name:</strong> {application?.storeName || user?.storeName}</div>
                <div><strong>Contact Phone:</strong> {application?.phone || user?.phone}</div>
                <div><strong>Business Address:</strong> {application?.businessAddress || user?.businessAddress}</div>
              </div>
            </div>
          </div>
        )}

        {/* Status: REJECTED */}
        {currentStatus === "rejected" && (
          <div className="seller-form-card" style={{ padding: "32px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b" }}>
              <FiXCircle size={28} style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>Application Rejected</h3>
                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                  Your previous seller application was rejected by admin. You may update your information below and re-apply for review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATION FORM (New User or Re-applying) */}
        {(!currentStatus || currentStatus === "rejected") && (
          <form onSubmit={handleSubmit} className="seller-form-card">
            <div className="form-group">
              <label>Store / Business Name *</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="storeName"
                  placeholder="e.g. Apex Electronics Store"
                  required
                  value={form.storeName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Business Phone Number *</label>
              <input
                type="text"
                name="phone"
                placeholder="e.g. +91 9876543210"
                required
                value={form.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Full Business Address *</label>
              <textarea
                name="businessAddress"
                rows={3}
                placeholder="Street name, Building, City, State, PIN code"
                required
                value={form.businessAddress}
                onChange={handleInputChange}
              />
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="seller-primary-btn"
                style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner"></span> Submitting...
                  </>
                ) : (
                  <>
                    <FiSend size={18} /> Submit Seller Application
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
