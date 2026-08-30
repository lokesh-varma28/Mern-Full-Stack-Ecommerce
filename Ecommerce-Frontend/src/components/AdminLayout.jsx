import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import "./AdminLayout.css";

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-main">
                <AdminNavbar />
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
