import { useEffect, useState, useCallback } from "react";
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
} from "../api/addressApi";
import "./Address.css";

const EMPTY_FORM = {
    fullName:    "",
    mobile:      "",
    pincode:     "",
    house:       "",
    area:        "",
    landmark:    "",
    city:        "",
    state:       "",
    country:     "India",
    addressType: "Home",
};

const STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
    "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
    "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
    "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
    "Andaman & Nicobar","Chandigarh","Delhi","Jammu & Kashmir","Ladakh",
    "Lakshadweep","Puducherry",
];

export default function Address() {
    const [addresses,   setAddresses]   = useState([]);
    const [form,        setForm]        = useState(EMPTY_FORM);
    const [editingId,   setEditingId]   = useState(null);
    const [showForm,    setShowForm]    = useState(false);
    const [loading,     setLoading]     = useState(true);
    const [saving,      setSaving]      = useState(false);
    const [toast,       setToast]       = useState({ msg: "", type: "" });

    /* ── toast ── */
    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3000);
    };

    /* ── load ── */
    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAddresses();
            // backend may return { addresses } or array directly
            setAddresses(res.data?.addresses || res.data || []);
        } catch (err) {
            console.error(err);
            showToast("Failed to load addresses", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    /* ── field change ── */
    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    /* ── open blank form ── */
    const openNew = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
        setTimeout(() => document.getElementById("addr-fullName")?.focus(), 80);
    };

    /* ── open edit form ── */
    const openEdit = (addr) => {
        setForm({
            fullName:    addr.fullName    || "",
            mobile:      addr.mobile      || "",
            pincode:     addr.pincode     || "",
            house:       addr.house       || "",
            area:        addr.area        || "",
            landmark:    addr.landmark    || "",
            city:        addr.city        || "",
            state:       addr.state       || "",
            country:     addr.country     || "India",
            addressType: addr.addressType || "Home",
        });
        setEditingId(addr._id);
        setShowForm(true);
        setTimeout(() => document.getElementById("addr-fullName")?.focus(), 80);
    };

    /* ── cancel form ── */
    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    /* ── validate ── */
    const validate = () => {
        const required = ["fullName","mobile","pincode","house","area","city","state"];
        for (const key of required) {
            if (!form[key].trim()) {
                showToast(`Please fill in: ${key}`, "warn");
                document.getElementById(`addr-${key}`)?.focus();
                return false;
            }
        }
        if (!/^\d{10}$/.test(form.mobile.trim())) {
            showToast("Mobile must be 10 digits", "warn");
            document.getElementById("addr-mobile")?.focus();
            return false;
        }
        if (!/^\d{6}$/.test(form.pincode.trim())) {
            showToast("Pincode must be 6 digits", "warn");
            document.getElementById("addr-pincode")?.focus();
            return false;
        }
        return true;
    };

    /* ── submit (add / update) ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            if (editingId) {
                await updateAddress(editingId, form);
                showToast("Address updated successfully");
            } else {
                await addAddress(form);
                showToast("Address added successfully");
            }
            cancelForm();
            load();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Failed to save address", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ── delete ── */
    const handleDelete = async (id) => {
        if (!window.confirm("Remove this address?")) return;
        try {
            await deleteAddress(id);
            showToast("Address removed");
            load();
        } catch (err) {
            console.error(err);
            showToast("Failed to delete address", "error");
        }
    };

    /* ── render ── */
    return (
        <div className="addr-page">

            {/* Toast */}
            {toast.msg && (
                <div className={`addr-toast addr-toast--${toast.type}`} role="alert">
                    {toast.msg}
                </div>
            )}

            <div className="addr-inner">

                {/* Page heading */}
                <div className="addr-page-header">
                    <div>
                        <h1 className="addr-page-title">Your Addresses</h1>
                        <p className="addr-page-sub">Manage delivery addresses saved to your account</p>
                    </div>
                </div>

                <div className="addr-layout">

                    {/* ══ LEFT – Address cards ══ */}
                    <div className="addr-cards-col">

                        {loading ? (
                            <div className="addr-loading">
                                <div className="addr-spinner" />
                                <p>Loading addresses…</p>
                            </div>
                        ) : (
                            <div className="addr-grid">

                                {/* Add new address card */}
                                <button
                                    onClick={openNew}
                                    className="addr-card addr-card--new"
                                    aria-label="Add a new address"
                                >
                                    <span className="addr-new-icon">＋</span>
                                    <span className="addr-new-label">Add a new address</span>
                                </button>

                                {/* Existing address cards */}
                                {addresses.length === 0 ? (
                                    <div className="addr-empty">
                                        <p className="addr-empty-icon">📍</p>
                                        <p className="addr-empty-title">No saved addresses</p>
                                        <p className="addr-empty-sub">Add your first delivery address above.</p>
                                    </div>
                                ) : (
                                    addresses.map((addr) => (
                                        <div key={addr._id} className="addr-card addr-card--saved">
                                            {/* Type badge */}
                                            <span className={`addr-type-badge addr-type-badge--${(addr.addressType || "Home").toLowerCase()}`}>
                                                {addr.addressType === "Home" ? "🏠" : addr.addressType === "Work" ? "🏢" : "📍"}
                                                &nbsp;{addr.addressType || "Home"}
                                            </span>

                                            {/* Address body */}
                                            <p className="addr-name">{addr.fullName}</p>
                                            <p className="addr-line">{addr.house}, {addr.area}</p>
                                            {addr.landmark && (
                                                <p className="addr-line addr-line--muted">Near: {addr.landmark}</p>
                                            )}
                                            <p className="addr-line">{addr.city}, {addr.state} – {addr.pincode}</p>
                                            <p className="addr-line">{addr.country}</p>
                                            <p className="addr-mobile">📞 {addr.mobile}</p>

                                            {/* Actions */}
                                            <div className="addr-card-actions">
                                                <button
                                                    onClick={() => openEdit(addr)}
                                                    className="addr-action-btn addr-action-btn--edit"
                                                >
                                                    Edit
                                                </button>
                                                <span className="addr-action-sep">|</span>
                                                <button
                                                    onClick={() => handleDelete(addr._id)}
                                                    className="addr-action-btn addr-action-btn--delete"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT – Form panel ══ */}
                    {showForm && (
                        <div className="addr-form-col">
                            <div className="addr-form-card">
                                <h2 className="addr-form-title">
                                    {editingId ? "Edit Address" : "Add a New Address"}
                                </h2>
                                <p className="addr-form-sub">India</p>

                                <form onSubmit={handleSubmit} noValidate>

                                    {/* Row 1 */}
                                    <div className="addr-form-group">
                                        <label htmlFor="addr-fullName" className="addr-label">
                                            Full name (First and Last name) <span className="addr-req">*</span>
                                        </label>
                                        <input
                                            id="addr-fullName"
                                            name="fullName"
                                            value={form.fullName}
                                            onChange={handleChange}
                                            className="addr-input"
                                            placeholder="Full name"
                                            autoComplete="name"
                                        />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="addr-form-group">
                                        <label htmlFor="addr-mobile" className="addr-label">
                                            Mobile number <span className="addr-req">*</span>
                                        </label>
                                        <div className="addr-phone-wrap">
                                            <span className="addr-phone-prefix">+91</span>
                                            <input
                                                id="addr-mobile"
                                                name="mobile"
                                                value={form.mobile}
                                                onChange={handleChange}
                                                className="addr-input addr-input--phone"
                                                placeholder="10-digit mobile number"
                                                maxLength={10}
                                                inputMode="numeric"
                                                autoComplete="tel"
                                            />
                                        </div>
                                        <p className="addr-hint">May be used to assist delivery</p>
                                    </div>

                                    {/* Row 3 – Pincode */}
                                    <div className="addr-form-group">
                                        <label htmlFor="addr-pincode" className="addr-label">
                                            Pincode <span className="addr-req">*</span>
                                        </label>
                                        <input
                                            id="addr-pincode"
                                            name="pincode"
                                            value={form.pincode}
                                            onChange={handleChange}
                                            className="addr-input addr-input--half"
                                            placeholder="6-digit pincode"
                                            maxLength={6}
                                            inputMode="numeric"
                                            autoComplete="postal-code"
                                        />
                                    </div>

                                    {/* Row 4 – Flat / House */}
                                    <div className="addr-form-group">
                                        <label htmlFor="addr-house" className="addr-label">
                                            Flat, House no., Building, Company, Apartment <span className="addr-req">*</span>
                                        </label>
                                        <input
                                            id="addr-house"
                                            name="house"
                                            value={form.house}
                                            onChange={handleChange}
                                            className="addr-input"
                                            placeholder="Flat / House no."
                                        />
                                    </div>

                                    {/* Row 5 – Area */}
                                    <div className="addr-form-group">
                                        <label htmlFor="addr-area" className="addr-label">
                                            Area, Street, Sector, Village <span className="addr-req">*</span>
                                        </label>
                                        <input
                                            id="addr-area"
                                            name="area"
                                            value={form.area}
                                            onChange={handleChange}
                                            className="addr-input"
                                            placeholder="Area / Street"
                                        />
                                    </div>

                                    {/* Row 6 – Landmark */}
                                    <div className="addr-form-group">
                                        <label htmlFor="addr-landmark" className="addr-label">
                                            Landmark <span className="addr-label--optional">(Optional)</span>
                                        </label>
                                        <input
                                            id="addr-landmark"
                                            name="landmark"
                                            value={form.landmark}
                                            onChange={handleChange}
                                            className="addr-input"
                                            placeholder="E.g. near Apollo Hospital"
                                        />
                                    </div>

                                    {/* Row 7 – City + State side-by-side */}
                                    <div className="addr-form-row">
                                        <div className="addr-form-group">
                                            <label htmlFor="addr-city" className="addr-label">
                                                Town / City <span className="addr-req">*</span>
                                            </label>
                                            <input
                                                id="addr-city"
                                                name="city"
                                                value={form.city}
                                                onChange={handleChange}
                                                className="addr-input"
                                                placeholder="City"
                                            />
                                        </div>

                                        <div className="addr-form-group">
                                            <label htmlFor="addr-state" className="addr-label">
                                                State <span className="addr-req">*</span>
                                            </label>
                                            <select
                                                id="addr-state"
                                                name="state"
                                                value={form.state}
                                                onChange={handleChange}
                                                className="addr-input addr-select"
                                            >
                                                <option value="">Select State</option>
                                                {STATES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 8 – Address type */}
                                    <div className="addr-form-group">
                                        <label className="addr-label">Address type</label>
                                        <div className="addr-type-row">
                                            {["Home", "Work", "Other"].map((type) => (
                                                <label key={type} className={`addr-type-opt ${form.addressType === type ? "addr-type-opt--active" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name="addressType"
                                                        value={type}
                                                        checked={form.addressType === type}
                                                        onChange={handleChange}
                                                        className="addr-type-radio"
                                                    />
                                                    {type === "Home" ? "🏠" : type === "Work" ? "🏢" : "📍"}&nbsp;{type}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="addr-form-actions">
                                        <button
                                            type="submit"
                                            className="addr-save-btn"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <><span className="addr-btn-spinner" /> Saving…</>
                                            ) : (
                                                editingId ? "Update Address" : "Add Address"
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelForm}
                                            className="addr-cancel-btn"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
