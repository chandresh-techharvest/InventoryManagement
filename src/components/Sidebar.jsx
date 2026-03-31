import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null); 
  const [subdomain, setSubdomain] = useState("");
  const [openInventory, setOpenInventory] = useState(false);
  const [openCategories, setOpenCategories] = useState(false);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1200) {
      document.body.classList.remove("layout-menu-expanded");
    }
  };

  useEffect(() => {
      fetchuser();
  }, [])  
    
  const fetchuser = async () => {
    const user = await api.get(`http://localhost:5000/api/tenant/me`);
    setSubdomain(user.data.tenant.subdomain);
  }

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      {/* Brand */}
      <div className="app-brand demo">
        <Link to={`/dashboard/${subdomain}`} className="app-brand-link">
          <span className="app-brand-logo demo">
            <img src="/assets/img/favicon/favicon.ico" alt="Logo" width="25" />
          </span>
          <span className="app-brand-text demo menu-text fw-bolder ms-2 text-capitalize">
            ERP System
          </span>
        </Link>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1" style={{overflowY: "auto", maxHeight:"100vh"}}>
        {/* Dashboard */}
        <li className="menu-item">
          <Link to={`/dashboard/${subdomain}`} className="menu-link" onClick={handleNavClick}>
            <i className="menu-icon tf-icons bx bx-home-circle"></i>
            <div>Dashboard</div>
          </Link>
        </li>

        {/* INVENTORY */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Inventory</span>
        </li>

        <li className={`menu-item ${openInventory ? "open" : ""}`}>
          <div
            className="menu-link menu-toggle"
            onClick={() => setOpenInventory(!openInventory)}
          >
            <i className="menu-icon tf-icons bx bx-box"></i>
            <div>Inventory</div>
          </div>

          <ul className="menu-sub">

            {/* WAREHOUSE */}
            <li className="menu-item">
              <Link
                to={`/dashboard/${subdomain}/warehouses`}
                className="menu-link"
                onClick={handleNavClick}
              >
                <div>Warehouses</div>
              </Link>
            </li>

            {/* PRODUCTS */}
            <li className="menu-item">
              <Link
                to={`/dashboard/${subdomain}/products`}
                className="menu-link"
                onClick={handleNavClick}
              >
                <div>Products</div>
              </Link>
            </li>

            {/* CATEGORIES */}
            <li
              className={`menu-item ${openCategories ? "open" : ""}`}
              onMouseEnter={() => setOpenCategories(true)}
              onMouseLeave={() => setOpenCategories(false)}
            >
              <div className="menu-link menu-toggle">
                <div>Categories</div>
              </div>

              <ul className="menu-sub">
                <li className="">
                  <Link
                    to={`/dashboard/${subdomain}/parent-categories`}
                    className="menu-link"
                    onClick={handleNavClick}
                  >
                    <div>Parent Categories</div>
                  </Link>
                </li>

                <li className="">
                  <Link
                    to={`/dashboard/${subdomain}/categories`}
                    className="menu-link"
                    onClick={handleNavClick}
                  >
                    <div>Sub-Categories</div>
                  </Link>
                </li>
              </ul>
            </li>

            {/* STOCK */}
            <li className="menu-item">
              <Link to="/stock" className="menu-link" onClick={handleNavClick}>
                <div>Stock</div>
              </Link>
            </li>

            {/* LOW STOCK */}
            <li className="menu-item">
              <Link to="/low-stock" className="menu-link" onClick={handleNavClick}>
                <div>Low Stock</div>
              </Link>
            </li>

            {/* TRANSFERS */}
            <li className="menu-item">
              <Link to="/transfers" className="menu-link" onClick={handleNavClick}>
                <div>Transfers</div>
              </Link>
            </li>

          </ul>
        </li>

        {/* POS */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">POS</span>
        </li>

        <li className={`menu-item ${openMenu === "pos" ? "open" : ""}`}>
          <div
            className="menu-link menu-toggle"
            onClick={() => toggleMenu("pos")}
          >
            <i className="menu-icon tf-icons bx bx-cart"></i>
            <div>Sales</div>
          </div>

          <ul className="menu-sub">
            <li className="menu-item">
              <Link to="/pos" className="menu-link" onClick={handleNavClick}>
                <div>New Sale</div>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/sales" className="menu-link" onClick={handleNavClick}>
                <div>Sales List</div>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/returns" className="menu-link">
                <div>Returns</div>
              </Link>
            </li>
          </ul>
        </li>

        {/* PURCHASE */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Purchases</span>
        </li>

        <li className={`menu-item ${openMenu === "purchase" ? "open" : ""}`}>
          <div
            className="menu-link menu-toggle"
            onClick={() => toggleMenu("purchase")}
          >
            <i className="menu-icon tf-icons bx bx-package"></i>
            <div>Purchases</div>
          </div>

          <ul className="menu-sub">
            <li className="menu-item">
              <Link to={`/dashboard/${subdomain}/purchase-orders`} className="menu-link" onClick={handleNavClick}>
                <div>Purchase Orders</div>
              </Link>
            </li>
            <li className="menu-item">
              <Link to={`/dashboard/${subdomain}/suppliers`} className="menu-link" onClick={handleNavClick}>
                <div>Suppliers</div>
              </Link>
            </li>
          </ul>
        </li>

        {/* REPORTS */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Reports</span>
        </li>

        <li className={`menu-item ${openMenu === "reports" ? "open" : ""}`}>
          <div
            className="menu-link menu-toggle"
            onClick={() => toggleMenu("reports")}
          >
            <i className="menu-icon tf-icons bx bx-bar-chart"></i>
            <div>Reports</div>
          </div>

          <ul className="menu-sub">
            <li className="menu-item">
              <Link to="/reports/sales" className="menu-link" onClick={handleNavClick}>
                <div>Sales Report</div>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/reports/inventory" className="menu-link" onClick={handleNavClick}>
                <div>Inventory Report</div>
              </Link>
            </li>
          </ul>
        </li>

        {/* SETTINGS */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Settings</span>
        </li>

        <li className={`menu-item ${openMenu === "settings" ? "open" : ""}`}>
          <div
            className="menu-link menu-toggle"
            onClick={() => toggleMenu("settings")}
          >
            <i className="menu-icon tf-icons bx bx-cog"></i>
            <div>Settings</div>
          </div>

          <ul className="menu-sub">
            <li className="menu-item">
              <Link to="/settings/business" className="menu-link" onClick={handleNavClick}>
                <div>Business</div>
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/settings/users" className="menu-link" onClick={handleNavClick}>
                <div>Users & Roles</div>
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </aside>
  );
}
