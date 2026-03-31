import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, tenant, logout } = useAuth();

  const base = `/company/${tenant?.subdomain}`;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme">

      {/* Mobile toggle */}
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <button
          className="nav-item nav-link px-0 me-xl-4 border-0 bg-transparent"
          onClick={() => {
            document.body.classList.toggle("layout-menu-expanded");
          }}
        >
          <i className="bx bx-menu bx-sm"></i>
        </button>
      </div>

      <div className="navbar-nav-right d-flex align-items-center w-100">

        {/* Search */}
        <div className="navbar-nav align-items-center flex-grow-1">
          <div className="nav-item d-flex align-items-center w-100">
            <i className="bx bx-search fs-4"></i>
            <input
              type="text"
              className="form-control border-0 shadow-none ms-2"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Avatar */}
        {user && (
          <ul className="navbar-nav flex-row align-items-center ms-3">
            <li className="nav-item navbar-dropdown dropdown-user dropdown">
              <a
                className="nav-link dropdown-toggle hide-arrow"
                href="#"
                data-bs-toggle="dropdown"
              >
                <div className="avatar avatar-online">
                  <span className="avatar-initial rounded-circle bg-primary text-white">
                    {getInitials(user.fullName)}
                  </span>
                </div>
              </a>

              <ul className="dropdown-menu dropdown-menu-end">

                {/* USER INFO */}
                <li>
                  <div className="dropdown-item">
                    <div className="d-flex">
                      <div className="me-3">
                        <div className="avatar avatar-online">
                          <span className="avatar-initial rounded-circle bg-primary text-white">
                            {getInitials(user.fullName)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="fw-semibold d-block">
                          {user.fullName}
                        </span>
                        <small className="text-muted">
                          {user.role}
                        </small>
                      </div>
                    </div>
                  </div>
                </li>

                <li><div className="dropdown-divider"></div></li>

                {/* ✅ FIXED ROUTES */}
                <li>
                  <Link className="dropdown-item" to={`${base}/profile`}>
                    <i className="bx bx-user me-2"></i>
                    My Profile
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to={`${base}/settings`}>
                    <i className="bx bx-cog me-2"></i>
                    Settings
                  </Link>
                </li>

                <li><div className="dropdown-divider"></div></li>

                <li>
                  <button className="dropdown-item" onClick={logout}>
                    <i className="bx bx-power-off me-2"></i>
                    Logout
                  </button>
                </li>

              </ul>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}