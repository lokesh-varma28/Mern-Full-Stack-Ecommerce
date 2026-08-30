import { useState, useEffect, useCallback } from "react";
import { getSellerProfile, updateSellerProfile } from "../../api/sellerApi";
import { useAuth } from "../../context/AuthContext";
import {
  FiBox,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiEdit,
  FiSave,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import "./Seller.css";

export default function SellerProfile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    storeName: "",
    phone: "",
    businessAddress: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerProfile();
      const sellerData = res.seller || res.data?.seller;
      if (sellerData) {
        setProfile(sellerData);
        setFormData({
          storeName: sellerData.storeName || "",
          phone: sellerData.phone || "",
          businessAddress: sellerData.businessAddress || "",
        });
      }
    } catch (err) {
      console.error("Error fetching seller profile:", err);
      setError(
        err.response?.data?.message || "Failed to load seller profile settings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Revert to current profile data on cancel
      if (profile) {
        setFormData({
          storeName: profile.storeName || "",
          phone: profile.phone || "",
          businessAddress: profile.businessAddress || "",
        });
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Validate inputs
    const storeName = formData.storeName.trim();
    const phone = formData.phone.trim();
    const businessAddress = formData.businessAddress.trim();

    if (!storeName) {
      showToast("Store Name is required", "error");
      return;
    }
    if (!phone) {
      showToast("Phone number is required", "error");
      return;
    }
    if (!businessAddress) {
      showToast("Business Address is required", "error");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await updateSellerProfile({
        storeName,
        phone,
        businessAddress,
      });

      const updatedSeller = res.seller || res.data?.seller;
      if (updatedSeller) {
        setProfile(updatedSeller);
        setFormData({
          storeName: updatedSeller.storeName || "",
          phone: updatedSeller.phone || "",
          businessAddress: updatedSeller.businessAddress || "",
        });

        // Sync React Auth Context & localStorage
        updateUser(updatedSeller);

        showToast("Seller profile updated successfully!", "success");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating seller profile:", err);
      const errMsg =
        err.response?.data?.message || "Failed to update seller profile";
      showToast(errMsg, "error");
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="seller-page-loading">
        <div className="seller-spinner"></div>
        <p>Loading seller profile details...</p>
      </div>
    );
  }

  return (
    <div className="seller-profile-page">
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`seller-toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header & Title */}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Store Profile & Settings</h1>
          <p className="seller-page-subtitle">
            Manage your store details, business address, and contact information.
          </p>
        </div>
        <div className="seller-header-actions">
          {!isEditing ? (
            <button
              onClick={handleEditToggle}
              className="seller-primary-btn"
              type="button"
            >
              <FiEdit /> Edit Profile
            </button>
          ) : (
            <button
              onClick={handleEditToggle}
              className="seller-secondary-btn"
              disabled={saving}
              type="button"
            >
              <FiX /> Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="seller-error-banner">
          <div className="seller-error-content">
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchProfile} className="seller-retry-btn">
            <FiRefreshCw /> Retry
          </button>
        </div>
      )}

      <div className="seller-form-card max-w-3xl">
        <form onSubmit={handleSubmit}>
          {/* Status Badge Banner */}
          <div className="flex items-center justify-between p-4 mb-6 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-emerald-600" size={24} />
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Account Status
                </span>
                <h3 className="text-base font-bold text-emerald-900 capitalize margin-0">
                  {profile?.sellerStatus === "approved"
                    ? "Approved Merchant Account"
                    : profile?.sellerStatus || "Approved"}
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full uppercase">
              {profile?.sellerStatus || "Approved"}
            </span>
          </div>

          {/* Account Information Section (Read Only) */}
          <div className="form-section">
            <h2 className="section-title flex items-center gap-2">
              <FiUser /> Account Information (Read-Only)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-100 border border-gray-300 rounded text-gray-800 text-sm font-medium">
                  <FiUser className="text-gray-400" />
                  <span>{profile?.name || "N/A"}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-100 border border-gray-300 rounded text-gray-800 text-sm font-medium">
                  <FiMail className="text-gray-400" />
                  <span>{profile?.email || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Information Section (Editable) */}
          <div className="form-section">
            <h2 className="section-title flex items-center gap-2">
              <FiBox /> Merchant Store Details
            </h2>

            <div className="form-group mb-4">
              <label htmlFor="storeName" className="form-label text-sm font-semibold text-gray-700">
                Store Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="e.g. Apex Electronics Hub"
                  className="p-2.5 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                  maxLength={100}
                  disabled={saving}
                  required
                />
              ) : (
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-900 text-sm font-semibold">
                  {profile?.storeName || "N/A"}
                </div>
              )}
            </div>

            <div className="form-group mb-4">
              <label htmlFor="phone" className="form-label text-sm font-semibold text-gray-700">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div className="relative flex items-center">
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 555-0199"
                    className="p-2.5 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                    maxLength={25}
                    disabled={saving}
                    required
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-900 text-sm font-medium">
                  <FiPhone className="text-gray-500" />
                  <span>{profile?.phone || "N/A"}</span>
                </div>
              )}
            </div>

            <div className="form-group mb-4">
              <label htmlFor="businessAddress" className="form-label text-sm font-semibold text-gray-700">
                Business Address <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <textarea
                  id="businessAddress"
                  name="businessAddress"
                  rows={3}
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="e.g. 100 Merchant Way, Suite 400, New York, NY 10001"
                  className="p-2.5 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                  maxLength={300}
                  disabled={saving}
                  required
                />
              ) : (
                <div className="flex items-start gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-900 text-sm font-medium">
                  <FiMapPin className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>{profile?.businessAddress || "N/A"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleEditToggle}
                className="seller-secondary-btn"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="seller-primary-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="btn-spinner"></span> Saving Changes...
                  </>
                ) : (
                  <>
                    <FiSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
