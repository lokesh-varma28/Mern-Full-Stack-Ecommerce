import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSellerProfile,
  updateSellerProfile,
  uploadSellerAvatar,
  uploadSellerCover,
} from "../api/sellerApi";
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
  FiCamera,
  FiImage,
  FiUploadCloud,
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Store Profile & Account Details
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your store branding, profile photos, contact details, and account settings.
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
          className={`p-4 rounded-xl flex items-center gap-2.5 text-sm font-semibold ${
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
          {/* Store Branding Card: Cover Banner + Avatar */}
          <div className="sp-card overflow-hidden p-0">
            {/* Hidden Inputs */}
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleAvatarSelect}
              className="hidden"
              aria-label="Upload profile photo file input"
            />
            <input
              type="file"
              ref={coverInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleCoverSelect}
              className="hidden"
              aria-label="Upload store cover banner file input"
            />

            {/* Cover Banner Area */}
            <div className="relative h-48 sm:h-56 w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center overflow-hidden">
              {profile?.coverImage ? (
                <img
                  src={profile.coverImage}
                  alt="Store Cover Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400 text-center p-4">
                  <FiImage className="mx-auto text-3xl mb-1 opacity-50" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                    No Cover Banner Set
                  </span>
                </div>
              )}

              {/* Uploading Spinner for Cover */}
              {uploadingCover && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center text-white gap-2 font-medium text-sm">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading Cover Banner...</span>
                </div>
              )}

              {/* Cover Upload Button */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                aria-label="Change store cover banner"
                className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition flex items-center gap-1.5 border border-white/20 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiCamera className="text-sm" />
                <span>{profile?.coverImage ? "Change Cover Banner" : "Add Cover Banner"}</span>
              </button>
            </div>

            {/* Avatar & Header Meta Bar */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
              <div className="flex items-end gap-4">
                {/* Profile Photo Circle */}
                <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-800 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || "Seller Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(profile?.name || profile?.storeName)}</span>
                  )}

                  {/* Uploading Spinner for Avatar */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center text-white">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Avatar Overlay Action Button */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="Upload profile photo"
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 focus:opacity-100 transition flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 focus:outline-none"
                    title="Change Profile Photo"
                  >
                    <FiCamera className="text-base" />
                    <span>Upload</span>
                  </button>
                </div>

                <div className="mb-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile?.storeName || profile?.name || "Merchant Store"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {profile?.email}
                  </p>
                </div>
              </div>

              {/* Action button to change profile avatar directly */}
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label="Change profile photo"
                  className="sp-btn sp-btn-secondary text-xs"
                >
                  <FiUploadCloud />
                  <span>Change Profile Photo</span>
                </button>
              </div>
            </div>
          </div>

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

