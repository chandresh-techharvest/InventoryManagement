import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Navigation config ────────────────────────────────────────────────────────
const navigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    path: "dashboard",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
    children: [
      { label: "Warehouses", path: "inventory/warehouses" },
      { label: "Products", path: "inventory/products" },
      {
        id: "categories",
        label: "Categories",
        children: [
          { label: "Parent Categories", path: "inventory/parent-categories" },
          { label: "Sub Categories", path: "inventory/categories" },
        ],
      },
      { label: "Stock", path: "inventory/stock" },
      { label: "Transfers", path: "inventory/transfers" },
      { label: "Stock Movements", path: "inventory/movements" },
    ],
  },
  {
    id: "purchase",
    label: "Purchases",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    children: [
      { label: "Purchase Orders", path: "purchases/purchase-orders" },
      { label: "Suppliers", path: "purchases/suppliers" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
      </svg>
    ),
    children: [
      { label: "New Sale", path: "pos" },
      { label: "Sales List", path: "sales" },
      { label: "Returns", path: "returns" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    children: [
      { label: "Sales Report", path: "reports/sales" },
      { label: "Inventory Report", path: "reports/inventory" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    children: [
      { label: "Business", path: "settings/business" },
      { label: "Users & Roles", path: "settings/users" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getBasePath = (subdomain) => `/company/${subdomain || ""}`;
const pathMatches = (pathname, basePath, path) =>
  pathname === `${basePath}/${path}` || pathname.startsWith(`${basePath}/${path}/`);

// Chevron icon
const ChevronIcon = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Hamburger / X icon
const MenuIcon = ({ collapsed }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    {collapsed ? (
      <>
        <line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ) : (
      <>
        <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
  </svg>
);

// ─── Tooltip wrapper (shown when sidebar is collapsed) ────────────────────────
function Tooltip({ label, children, collapsed }) {
  const [visible, setVisible] = useState(false);
  if (!collapsed) return children;
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="sb-tooltip">
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, tenant } = useAuth();
  const { subdomain: routeSubdomain } = useParams();
  const { pathname } = useLocation();

  const subdomain = tenant?.subdomain || routeSubdomain || "";
  const basePath = getBasePath(subdomain);
  const profilePath = `${basePath}/profile`;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [manualOpenMenus, setManualOpenMenus] = useState(() => new Set());

  // Detect which parents contain the active route
  const activeParents = useMemo(() => {
    const parents = new Set();
    navigation.forEach((item) => {
      if (item.path && pathMatches(pathname, basePath, item.path)) parents.add(item.id);
      item.children?.forEach((child) => {
        if (child.path && pathMatches(pathname, basePath, child.path)) parents.add(item.id);
        child.children?.forEach((grandChild) => {
          if (pathMatches(pathname, basePath, grandChild.path)) {
            parents.add(item.id);
            if (child.id) parents.add(child.id);
          }
        });
      });
    });
    return parents;
  }, [basePath, pathname]);

  // Merge manual open + auto-open from active route
  const openMenus = useMemo(() => {
    const next = new Set(manualOpenMenus);
    activeParents.forEach((id) => next.add(id));
    return next;
  }, [activeParents, manualOpenMenus]);

  // Auto-collapse on small screens
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1200) {
        setIsCollapsed(false); // don't use desktop collapse on mobile
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleMenu = (menuId) => {
    if (isCollapsed) return; // no dropdowns in icon mode
    setManualOpenMenus((cur) => {
      const next = new Set(cur);
      next.has(menuId) ? next.delete(menuId) : next.add(menuId);
      return next;
    });
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1200) setIsMobileOpen(false);
  };

  const displayFullName = user?.fullName || tenant?.ownerName || "Admin User";

  // Initials from displayed name
  const userInitials = displayFullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // ── Render a leaf link ──────────────────────────────────────────────────────
  const renderLink = (item, depth = 1) => (
    <NavLink
      key={item.path}
      to={`${basePath}/${item.path}`}
      className={({ isActive }) => `sb-link sb-link-depth${depth}${isActive ? " sb-link-active" : ""}`}
      onClick={handleNavClick}
    >
      <span className="sb-link-dot" />
      <span className="sb-label">{item.label}</span>
    </NavLink>
  );

  // ── Sidebar shell ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        className={`sb-backdrop${isMobileOpen ? " sb-backdrop-show" : ""}`}
        aria-label="Close sidebar"
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile open button (shown only on mobile when sidebar is closed) */}
      <button
        type="button"
        className="sb-mobile-toggle"
        aria-label="Open menu"
        onClick={() => setIsMobileOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="2" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`sb-shell${isCollapsed ? " sb-collapsed" : ""}${isMobileOpen ? " sb-mobile-open" : ""}`}>

        {/* ── Header ── */}
        <div className="sb-header">
          <div className="sb-brand">
            <div className="sb-brand-mark">IM</div>
            <div className="sb-brand-text">
              <strong>{tenant?.businessName || "Inventory Hub"}</strong>
              <span>{tenant?.subdomain || "Operations"}</span>
            </div>
          </div>

          {/* Desktop collapse / mobile close button */}
          <button
            type="button"
            className="sb-toggle-btn"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => {
              if (window.innerWidth < 1200) {
                setIsMobileOpen(false);
              } else {
                setIsCollapsed((v) => !v);
              }
            }}
          >
            <MenuIcon collapsed={isCollapsed} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="sb-nav">
          {navigation.map((item) => {
            const isOpen = openMenus.has(item.id);
            const isParentActive = activeParents.has(item.id);

            // Plain link (Dashboard)
            if (item.path) {
              return (
                <Tooltip key={item.id} label={item.label} collapsed={isCollapsed}>
                  <NavLink
                    to={`${basePath}/${item.path}`}
                    className={({ isActive }) => `sb-link sb-link-top${isActive ? " sb-link-active" : ""}`}
                    onClick={handleNavClick}
                  >
                    <span className="sb-icon">{item.icon}</span>
                    <span className="sb-label">{item.label}</span>
                  </NavLink>
                </Tooltip>
              );
            }

            // Group with children
            return (
              <div
                key={item.id}
                className={`sb-group${isOpen ? " sb-group-open" : ""}${isParentActive ? " sb-group-current" : ""}`}
              >
                <Tooltip label={item.label} collapsed={isCollapsed}>
                  <button
                    type="button"
                    className="sb-link sb-link-top sb-group-btn"
                    onClick={() => toggleMenu(item.id)}
                  >
                    <span className="sb-link-left">
                      <span className="sb-icon">{item.icon}</span>
                      <span className="sb-label">{item.label}</span>
                    </span>
                    <span className="sb-label sb-chevron-wrap">
                      <ChevronIcon open={isOpen} />
                    </span>
                  </button>
                </Tooltip>

                <div className="sb-children">
                  <div className="sb-children-inner">
                    {item.children?.map((child) => {
                      if (child.children) {
                        const isChildOpen = openMenus.has(child.id);
                        const isChildActive = child.id && activeParents.has(child.id);
                        return (
                          <div
                            key={child.id}
                            className={`sb-subgroup${isChildOpen ? " sb-group-open" : ""}${isChildActive ? " sb-group-current" : ""}`}
                          >
                            <button
                              type="button"
                              className="sb-link sb-link-child sb-group-btn"
                              onClick={() => toggleMenu(child.id)}
                            >
                              <span className="sb-link-dot" />
                              <span className="sb-label">{child.label}</span>
                              <span className="sb-chevron-wrap"><ChevronIcon open={isChildOpen} /></span>
                            </button>
                            <div className="sb-grandchildren">
                              <div className="sb-children-inner">
                                {child.children.map((gc) => renderLink(gc, 2))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return renderLink(child, 1);
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── User footer ── */}
        <div className="sb-footer">
          <Tooltip label={displayFullName} collapsed={isCollapsed}>
            <div className="sb-user">
              <Link to={profilePath} className="sb-user-avatar">{userInitials}</Link>
              <div className="sb-user-info">
                <Link to={profilePath} className="sb-user-name">{displayFullName}</Link>
                <span className="sb-user-role">Administrator</span>
              </div>
            </div>
          </Tooltip>
        </div>
      </aside>

      {/* ── Styles ── */}
      <style>{`
        /* ── Reset & tokens ─────────────────────────────────────── */
        .sb-shell *, .sb-shell *::before, .sb-shell *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Backdrop (mobile) ──────────────────────────────────── */
        .sb-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          border: 0;
          z-index: 1040;
          cursor: default;
        }
        @media (max-width: 1199px) {
          .sb-backdrop { display: block; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
          .sb-backdrop.sb-backdrop-show { opacity: 1; pointer-events: auto; }
        }

        /* ── Mobile open button ─────────────────────────────────── */
        .sb-mobile-toggle {
          display: none;
          position: fixed;
          top: 14px;
          left: 14px;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          color: #374151;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1045;
          transition: box-shadow 0.2s;
        }
        .sb-mobile-toggle:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        @media (max-width: 1199px) {
          .sb-mobile-toggle { display: flex; }
        }

        /* ── Shell ──────────────────────────────────────────────── */
        .sb-shell {
          width: 260px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          overflow: hidden;
          flex-shrink: 0;
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
          z-index: 1041;
        }

        /* Desktop collapsed */
        @media (min-width: 1200px) {
          .sb-shell.sb-collapsed {
            width: 60px;
          }
          .sb-shell.sb-collapsed .sb-brand-text,
          .sb-shell.sb-collapsed .sb-label,
          .sb-shell.sb-collapsed .sb-children,
          .sb-shell.sb-collapsed .sb-grandchildren,
          .sb-shell.sb-collapsed .sb-user-info {
            display: none !important;
          }
          .sb-shell.sb-collapsed .sb-header {
            justify-content: center;
            padding: 12px 8px;
          }
          .sb-shell.sb-collapsed .sb-brand {
            display: none;
          }
          .sb-shell.sb-collapsed .sb-link-top {
            justify-content: center;
            padding: 10px 0;
          }
          .sb-shell.sb-collapsed .sb-link-left {
            justify-content: center;
          }
          .sb-shell.sb-collapsed .sb-nav {
            padding: 10px 8px;
          }
          .sb-shell.sb-collapsed .sb-user {
            justify-content: center;
          }
          .sb-shell.sb-collapsed .sb-footer {
            padding: 10px 8px;
          }
          .sb-shell.sb-collapsed .sb-group {
            overflow: visible;
            position: relative;
          }
        }

        /* Mobile */
        @media (max-width: 1199px) {
          .sb-shell {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
            z-index: 1041;
          }
          .sb-shell.sb-mobile-open {
            transform: translateX(0);
          }
        }

        /* ── Header ─────────────────────────────────────────────── */
        .sb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 14px 12px;
          border-bottom: 1px solid #f3f4f6;
          min-height: 62px;
          flex-shrink: 0;
        }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          flex: 1;
          min-width: 0;
        }

        .sb-brand-mark {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #1a1a2e;
          color: #a78bfa;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.04em;
        }

        .sb-brand-text {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sb-brand-text strong {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }

        .sb-brand-text span {
          font-size: 11px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Toggle button ──────────────────────────────────────── */
        .sb-toggle-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .sb-toggle-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #111827;
        }

        /* ── Nav ────────────────────────────────────────────────── */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
        .sb-nav::-webkit-scrollbar { width: 4px; }
        .sb-nav::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 9px; }

        /* ── Link base ──────────────────────────────────────────── */
        .sb-link {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          border: 0;
          background: transparent;
          text-decoration: none;
          border-radius: 8px;
          color: #374151;
          cursor: pointer;
          transition: background 0.14s ease, color 0.14s ease;
          position: relative;
          overflow: hidden;
          text-align: left;
          white-space: nowrap;
        }
        .sb-link:hover {
          background: #f9fafb;
          color: #111827;
        }

        /* Top-level link */
        .sb-link-top {
          padding: 8px 10px;
          font-size: 13.5px;
          font-weight: 500;
        }

        /* Active top-level */
        .sb-link-top.sb-link-active {
          background: #f0effe;
          color: #6d28d9;
          font-weight: 600;
        }
        .sb-link-top.sb-link-active .sb-icon {
          color: #7c3aed;
        }

        /* Child link */
        .sb-link-child {
          padding: 6.5px 10px;
          font-size: 12.5px;
          font-weight: 400;
          color: #6b7280;
          margin-left: 6px;
        }
        .sb-link-child.sb-link-active {
          background: #f0effe;
          color: #6d28d9;
          font-weight: 500;
        }
        .sb-link-depth1 {
          padding: 6.5px 10px;
          font-size: 12.5px;
          color: #6b7280;
          margin-left: 6px;
        }
        .sb-link-depth1.sb-link-active {
          background: #f0effe;
          color: #6d28d9;
          font-weight: 500;
        }
        .sb-link-depth2 {
          padding: 6px 10px 6px 22px;
          font-size: 12px;
          color: #9ca3af;
          margin-left: 0;
        }
        .sb-link-depth2.sb-link-active {
          color: #7c3aed;
          background: #f5f3ff;
          font-weight: 500;
        }
        .sb-subgroup {
          margin-left: 0;
        }
        .sb-subgroup > .sb-group-btn {
          padding: 6.5px 10px 6.5px 13px;
          color: #6b7280;
          width: calc(100% - 6px);
          margin-left: 6px;
          border-radius: 8px;
        }
        .sb-subgroup > .sb-group-btn:hover {
          background: #f9fafb;
          color: #111827;
        }
        .sb-subgroup > .sb-group-btn .sb-link-dot {
          margin-left: 0;
        }
        .sb-subgroup > .sb-group-btn .sb-chevron-wrap {
          margin-left: auto;
        }
        .sb-subgroup .sb-grandchildren {
          margin-left: 12px;
        }

        /* Dot indicator for child links */
        .sb-link-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #d1d5db;
          flex-shrink: 0;
          margin-left: 2px;
          transition: background 0.14s;
        }
        .sb-link-active .sb-link-dot {
          background: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }

        /* Group trigger layout */
        .sb-group-btn {
          justify-content: space-between;
        }
        .sb-link-left {
          display: flex;
          align-items: center;
          gap: 9px;
          overflow: hidden;
        }
        .sb-chevron-wrap {
          color: #9ca3af;
          flex-shrink: 0;
        }

        /* Highlight group trigger when active but collapsed */
        .sb-group-current > .sb-group-btn {
          color: #6d28d9;
        }
        .sb-group-current > .sb-group-btn .sb-icon {
          color: #7c3aed;
        }

        /* ── Icon ───────────────────────────────────────────────── */
        .sb-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6b7280;
          transition: color 0.14s;
        }
        .sb-link:hover .sb-icon,
        .sb-group-current > .sb-group-btn .sb-icon {
          color: #374151;
        }
        .sb-link-active .sb-icon {
          color: #7c3aed !important;
        }

        /* ── Accordion children ─────────────────────────────────── */
        .sb-children,
        .sb-grandchildren {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .sb-group-open > .sb-children,
        .sb-subgroup.sb-group-open > .sb-grandchildren {
          grid-template-rows: 1fr;
        }
        .sb-children-inner {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding-top: 2px;
        }

        /* ── Footer ─────────────────────────────────────────────── */
        .sb-footer {
          padding: 10px 10px;
          border-top: 1px solid #f3f4f6;
          flex-shrink: 0;
        }

        .sb-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.14s;
        }
        .sb-user:hover { background: #f9fafb; }

        .sb-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #1a1a2e;
          color: #a78bfa;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.04em;
          text-decoration: none;
        }

        .sb-user-info {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .sb-user-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: none;
          transition: color 0.14s ease;
        }
        .sb-user:hover .sb-user-name,
        .sb-user-name:hover {
          color: #6d28d9;
        }
        .sb-user-role {
          font-size: 11px;
          color: #9ca3af;
        }

        /* ── Tooltip ─────────────────────────────────────────────── */
        .sb-tooltip {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #111827;
          color: #f9fafb;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .sb-tooltip::before {
          content: "";
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #111827;
        }
      `}</style>
    </>
  );
}
