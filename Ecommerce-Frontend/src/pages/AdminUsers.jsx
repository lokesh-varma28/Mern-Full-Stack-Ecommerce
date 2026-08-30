import { useEffect, useState, useCallback } from "react";
import { getUsers, deleteUser } from "../api/adminApi";
import "./AdminTable.css";

function Avatar({ name }) {
    const letters = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return <div className="at-avatar">{letters}</div>;
}

export default function AdminUsers() {
    const [users,    setUsers]   = useState([]);
    const [search,   setSearch]  = useState("");
    const [loading,  setLoading] = useState(true);
    const [toast,    setToast]   = useState({ msg: "", type: "" });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3000);
    };

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.data?.users || res.data || []);
        } catch (err) {
            console.error(err);
            showToast("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            await deleteUser(id);
            showToast(`"${name}" deleted successfully`);
            loadUsers();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Failed to delete user", "error");
        }
    };

    const filtered = users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="at-page">
            {toast.msg && (
                <div className={`at-toast at-toast--${toast.type}`} role="alert">{toast.msg}</div>
            )}

            <div className="at-inner">
                {/* Header */}
                <div className="at-page-header">
                    <div>
                        <h1 className="at-page-title">Manage Users</h1>
                        <p className="at-page-sub">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="at-search-wrap">
                        <span className="at-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="at-search-input"
                        />
                    </div>
                </div>

                {/* Table card */}
                <div className="at-card">
                    {loading ? (
                        <div className="at-loading"><div className="at-spinner" /><p>Loading users…</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="at-empty">
                            <p className="at-empty-icon">👤</p>
                            <p className="at-empty-title">{search ? "No users match your search" : "No users found"}</p>
                        </div>
                    ) : (
                        <div className="at-table-wrap">
                            <table className="at-table">
                                <thead>
                                    <tr className="at-thead-row">
                                        <th className="at-th">#</th>
                                        <th className="at-th">User</th>
                                        <th className="at-th">Email</th>
                                        <th className="at-th">Role</th>
                                        <th className="at-th">Verified</th>
                                        <th className="at-th">Joined</th>
                                        <th className="at-th">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((user, idx) => (
                                        <tr key={user._id} className="at-row">
                                            <td className="at-td at-td--num">{idx + 1}</td>
                                            <td className="at-td">
                                                <div className="at-user-cell">
                                                    <Avatar name={user.name} />
                                                    <span className="at-user-name">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="at-td at-td--email">{user.email}</td>
                                            <td className="at-td">
                                                <span className={`at-role-badge at-role-badge--${user.role}`}>
                                                    {user.role === "admin" ? "🛡 Admin" : "👤 Customer"}
                                                </span>
                                            </td>
                                            <td className="at-td at-td--center">
                                                {user.isVerified
                                                    ? <span className="at-verified at-verified--yes">✓ Yes</span>
                                                    : <span className="at-verified at-verified--no">✗ No</span>
                                                }
                                            </td>
                                            <td className="at-td">
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                                    : "—"}
                                            </td>
                                            <td className="at-td">
                                                {user.role !== "admin" ? (
                                                    <button
                                                        onClick={() => handleDelete(user._id, user.name)}
                                                        className="at-delete-btn"
                                                    >
                                                        Delete
                                                    </button>
                                                ) : (
                                                    <span className="at-protected">Protected</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Row count */}
                {!loading && filtered.length > 0 && (
                    <p className="at-row-count">
                        Showing {filtered.length} of {users.length} users
                    </p>
                )}
            </div>
        </div>
    );
}
