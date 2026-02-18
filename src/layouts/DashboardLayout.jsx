import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function DashboardLayout() {
  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">

        <Sidebar></Sidebar>

        {/* Main */}
        <div className="layout-page">
            <Navbar></Navbar>
            <div className="content-wrapper">
                <Outlet />
            </div>
            <Footer></Footer>
        </div>
      </div>
      <div
        className="layout-overlay layout-menu-toggle"
        onClick={() =>
          document.body.classList.remove("layout-menu-expanded")
        }
      />
    </div>
  );
}
