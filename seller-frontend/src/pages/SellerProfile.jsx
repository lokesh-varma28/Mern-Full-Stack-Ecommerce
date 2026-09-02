import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSellerProfile,
  updateSellerProfile,
  uploadSellerAvatar,
  uploadSellerCover,
} from "../api/sellerApi";
import { useAuth } from "../context/AuthContext";
import {
  FiShoppingBag,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSave,
  FiCamera,
  FiImage,
  FiShield,
  FiCheck,
} from "react-icons/fi";

export default function SellerProfile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    storeName: "",
    phone: "",
    businessAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState({ msg: "", type: "" });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setMessage({ msg: "", type: "" });

      const res = await getSellerProfile();
      const s = res.data?.seller || res.seller || {};

      setProfile(s);
      setFormData({
        storeName: s.storeName || "",
        phone: s.phone || "",
        businessAddress: s.businessAddress || "",
      });
    } catch (err) {
      console.error("Error fetching seller profile:", err);
      setMessage({
        msg: err.response?.data?.message || "Failed to load seller profile.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ msg: "Please select a valid image file (JPEG, PNG, WEBP).", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ msg: "Profile photo must be less than 5MB.", type: "error" });
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage({ msg: "", type: "" });

      const data = new FormData();
      data.append("avatar", file);

      const res = await uploadSellerAvatar(data);
      const updatedSeller = res.data?.seller || {};

      setProfile((prev) => ({ ...prev, ...updatedSeller }));
      setMessage({
        msg: res.data?.message || "Profile photo updated successfully!",
        type: "success",
      });

      await refreshUser();
    } catch (err) {
      console.error("Error uploading profile photo:", err);
      setMessage({
        msg: err.response?.data?.message || "Failed to upload profile photo.",
        type: "error",
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ msg: "Please select a valid image file (JPEG, PNG, WEBP).", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ msg: "Cover banner image must be less than 5MB.", type: "error" });
      return;
    }

    try {
      setUploadingCover(true);
      setMessage({ msg: "", type: "" });

      const data = new FormData();
      data.append("coverImage", file);

      const res = await uploadSellerCover(data);
      const updatedSeller = res.data?.seller || {};

      setProfile((prev) => ({ ...prev, ...updatedSeller }));
      setMessage({
        msg: res.data?.message || "Store cover banner updated successfully!",
        type: "success",
      });

      await refreshUser();
    } catch (err) {
      console.error("Error uploading cover banner:", err);
      setMessage({
        msg: err.response?.data?.message || "Failed to upload cover banner.",
        type: "error",
      });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName.trim()) {
      setMessage({ msg: "Store Name cannot be empty.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setMessage({ msg: "", type: "" });

      const payload = {
        storeName: formData.storeName.trim(),
        phone: formData.phone.trim(),
        businessAddress: formData.businessAddress.trim(),
      };

      const res = await updateSellerProfile(payload);
      setMessage({
        msg: res.data?.message || "Store profile updated successfully!",
        type: "success",
      });

      await fetchProfile();
      await refreshUser();
    } catch (err) {
      console.error("Error updating seller profile:", err);
      setMessage({
        msg: err.response?.data?.message || "Failed to update profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "S"
    );
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "2rem" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Merchant Store Profile
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
            Manage your store branding, profile photos, contact information, and security settings.
          </p>
        </div>

        <button
          onClick={fetchProfile}
          disabled={loading}
          className="sp-btn sp-btn-secondary"
          style={{ minHeight: "44px", padding: "0 1rem" }}
          title="Refresh Profile Details"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Banner */}
      {message.msg && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            backgroundColor: message.type === "success" ? "#ecfdf5" : "#fff1f2",
            color: message.type === "success" ? "#065f46" : "#9f1239",
            border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
          }}
        >
          {message.type === "success" ? (
            <FiCheckCircle style={{ fontSize: "1.25rem", color: "#059669", flexShrink: 0 }} />
          ) : (
            <FiAlertCircle style={{ fontSize: "1.25rem", color: "#e11d48", flexShrink: 0 }} />
          )}
          <span>{message.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="sp-card" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading merchant profile details...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Visually Hidden Native File Inputs */}
          <input
            type="file"
            ref={avatarInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleAvatarSelect}
            style={{ display: "none" }}
            aria-label="Upload profile photo file input"
          />
          <input
            type="file"
            ref={coverInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleCoverSelect}
            style={{ display: "none" }}
            aria-label="Upload store cover banner file input"
          />

          {/* Controlled Store Branding Header Card */}
          <div className="sp-profile-header-card">
            {/* Controlled Cover Banner Area */}
            <div className="sp-cover-container">
              {profile?.coverImage ? (
                <img
                  src={profile.coverImage}
                  alt="Store Cover Banner"
                  className="sp-cover-img"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                />
              ) : (
                <div className="sp-cover-fallback">
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                    <FiImage style={{ fontSize: "1.5rem", color: "#cbd5e1" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#cbd5e1" }}>
                    No Store Cover Banner
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                    Upload a banner to customize your merchant storefront
                  </span>
                </div>
              )}

              {/* Uploading Overlay for Cover */}
              {uploadingCover && (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", gap: "0.75rem", fontWeight: 600, fontSize: "0.875rem", zIndex: 20 }}>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading Cover Banner...</span>
                </div>
              )}

              {/* Cover Camera Button */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="sp-cover-camera-btn"
                title="Change cover banner"
                aria-label="Change store cover banner"
              >
                <FiCamera style={{ fontSize: "1.125rem" }} />
              </button>
            </div>

            {/* Profile Avatar & Metadata Bar */}
            <div className="sp-profile-meta-bar">
              <div className="sp-avatar-wrapper">
                {/* Avatar Container with Camera Badge */}
                <div className="sp-avatar-container">
                  <div className="sp-avatar-circle">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name || "Seller Profile"}
                        className="sp-avatar-img"
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <span>{getInitials(profile?.name || profile?.storeName)}</span>
                    )}

                    {/* Uploading Overlay for Avatar */}
                    {uploadingAvatar && (
                      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", zIndex: 20 }}>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Avatar Camera Badge Button */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="sp-avatar-camera-btn"
                    title="Change profile photo"
                    aria-label="Change profile photo"
                  >
                    <FiCamera style={{ fontSize: "0.95rem" }} />
                  </button>
                </div>

                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                      {profile?.storeName || profile?.name || "Merchant Store"}
                    </h2>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.625rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                      <FiCheck style={{ color: "#059669" }} />
                      APPROVED PARTNER
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500, marginTop: "0.25rem" }}>
                    {profile?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Security & Identity (Read-Only) Section */}
          <div className="sp-card">
            <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiShield style={{ color: "#2563eb", fontSize: "1.125rem" }} />
              <span>Account Security & Identity (Read-Only)</span>
            </h3>

            <div className="sp-security-grid">
              <div className="sp-security-box">
                <span className="sp-security-label">Account Owner</span>
                <span className="sp-security-value">{profile?.name || "N/A"}</span>
              </div>

              <div className="sp-security-box">
                <span className="sp-security-label">Email Address</span>
                <span className="sp-security-value">{profile?.email || "N/A"}</span>
              </div>

              <div className="sp-security-box">
                <span className="sp-security-label">Account Role</span>
                <span className="sp-security-value" style={{ textTransform: "uppercase" }}>{profile?.role || "SELLER"}</span>
              </div>

              <div className="sp-security-box">
                <span className="sp-security-label">Seller Status</span>
                <div>
                  <span style={{ display: "inline-block", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>
                    {profile?.sellerStatus || "APPROVED"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Store Profile Card */}
          <div className="sp-card">
            <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiShoppingBag style={{ color: "#2563eb", fontSize: "1.125rem" }} />
              <span>Editable Store Profile Details</span>
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Store Name *
                </label>
                <div style={{ position: "relative" }}>
                  <FiShoppingBag style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="e.g. Acme Superstore"
                    className="sp-input"
                    style={{ paddingLeft: "2.5rem", minHeight: "44px" }}
                  />
                </div>
              </div>

              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Contact Phone Number
                </label>
                <div style={{ position: "relative" }}>
                  <FiPhone style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={25}
                    placeholder="+1 (555) 019-2834"
                    className="sp-input"
                    style={{ paddingLeft: "2.5rem", minHeight: "44px" }}
                  />
                </div>
              </div>

              <div className="sp-input-group" style={{ marginBottom: 0 }}>
                <label className="sp-label" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#334155" }}>
                  Business Address
                </label>
                <div style={{ position: "relative" }}>
                  <FiMapPin style={{ position: "absolute", left: "0.875rem", top: "0.875rem", color: "#94a3b8" }} />
                  <textarea
                    name="businessAddress"
                    rows={3}
                    value={formData.businessAddress}
                    onChange={handleChange}
                    maxLength={300}
                    placeholder="123 Commerce St, Suite 400, New York, NY 10001"
                    className="sp-textarea"
                    style={{ paddingLeft: "2.5rem", paddingTop: "0.75rem" }}
                  />
                </div>
              </div>

              <div style={{ paddingTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="sp-btn sp-btn-primary"
                  style={{ minHeight: "44px", padding: "0 1.5rem" }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <FiSave style={{ fontSize: "1rem" }} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}





