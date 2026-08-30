import { useEffect, useState, useCallback } from "react";
import { getSellerProfile, updateSellerProfile } from "../api/sellerApi";
import { useAuth } from "../context/AuthContext";
import {
  FiUser,
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSave,
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
  const [message, setMessage] = useState({ msg: "", type: "" });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName.trim()) {
      setMessage({ msg: "Store Name cannot be empty.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setMessage({ msg: "", type: "" });

      // Send ONLY allowed editable fields
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Store Profile & Account Details
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your store information, contact details, and account preferences.
          </p>
        </div>

        <button
          onClick={fetchProfile}
          disabled={loading}
          className="sp-btn sp-btn-secondary"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {message.msg && (
        <div
          className={`p-4 mb-6 rounded-xl flex items-center gap-2.5 text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <FiCheckCircle className="text-lg flex-shrink-0" />
          ) : (
            <FiAlertCircle className="text-lg flex-shrink-0" />
          )}
          <span>{message.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="sp-card text-center p-8 text-slate-500">
          Loading merchant profile...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Read-Only Account Info Card */}
          <div className="sp-card">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" /> Account Security & Identity (Read-Only)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                  Account Owner Name
                </span>
                <span className="font-bold text-slate-800">
                  {profile?.name || "N/A"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                  Email Address
                </span>
                <span className="font-bold text-slate-800">
                  {profile?.email || "N/A"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                  Account Role
                </span>
                <span className="font-bold text-slate-800 uppercase">
                  {profile?.role || "SELLER"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                  Seller Status
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                  {profile?.sellerStatus || "APPROVED"}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Store Profile Card */}
          <div className="sp-card">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <FiShoppingBag className="text-blue-600" /> Editable Store Profile Details
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="sp-input-group mb-0">
                <label className="sp-label">Store Name *</label>
                <div className="relative">
                  <FiShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="e.g. Acme Superstore"
                    className="sp-input pl-10"
                  />
                </div>
              </div>

              <div className="sp-input-group mb-0">
                <label className="sp-label">Contact Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={25}
                    placeholder="+1 (555) 019-2834"
                    className="sp-input pl-10"
                  />
                </div>
              </div>

              <div className="sp-input-group mb-0">
                <label className="sp-label">Business Address</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    name="businessAddress"
                    rows={3}
                    value={formData.businessAddress}
                    onChange={handleChange}
                    maxLength={300}
                    placeholder="123 Commerce St, Suite 400, New York, NY 10001"
                    className="sp-textarea pl-10"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="sp-btn sp-btn-primary"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <FiSave />
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
