import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWarehouses, deleteWarehouse } from "../../../lib/warehouseAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";

/* ─── tiny helpers ─────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[...Array(7)].map((_, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div
          style={{
            height: 13,
            borderRadius: 6,
            width: ["70%", "40%", "55%", "60%", "50%", "30%", "80%"][i],
            background:
              "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
            backgroundSize: "200% 100%",
            animation: "wh-shimmer 1.4s infinite",
          }}
        />
      </td>
    ))}
  </tr>
);

const StatCard = ({ icon, label, value, accent }) => (
  <div className="col-6 col-xl-3">
    <div
      className="card h-100 mb-0"
      style={{
        borderTop: `3px solid ${accent}`,
        boxShadow: "0 1px 10px rgba(0,0,0,.06)",
        transition: "transform .18s, box-shadow .18s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.11)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 10px rgba(0,0,0,.06)";
      }}
    >
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            background: accent + "18",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
            {label}
          </p>
          <h4 className="mb-0 fw-bold" style={{ letterSpacing: "-0.5px" }}>
            {value}
          </h4>
        </div>
      </div>
    </div>
  </div>
);

/* ─── confirm modal ─────────────────────────────────── */
const ConfirmModal = ({ name, onConfirm, onCancel }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(22,29,49,.45)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(2px)",
      animation: "wh-fadein .15s ease",
    }}
  >
    <div
      className="card"
      style={{
        width: 400,
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,.22)",
        border: "none",
        animation: "wh-popup .2s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <div className="card-body p-4 text-center">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{
            width: 56,
            height: 56,
            background: "rgba(234,84,85,.1)",
            fontSize: 26,
          }}
        >
          🗑️
        </div>
        <h5 className="fw-bold mb-1">Delete Warehouse?</h5>
        <p className="text-muted mb-4" style={{ fontSize: 13.5 }}>
          <strong>{name}</strong> will be permanently removed. This action
          cannot be undone.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <button
            className="btn btn-outline-secondary px-4"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger px-4"
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─── main component ─────────────────────────────────── */
export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters — unchanged
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  // pagination — unchanged
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // UI-only state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { applyFilters(); }, [warehouses, search, category, city]);

  /* ── all original logic unchanged ── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [wRes, cRes] = await Promise.all([
        getWarehouses(),
        getParentCategories(),
      ]);
      setWarehouses(wRes.data.data || []);
      setCategories(cRes.data.data || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let list = [...warehouses];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.name?.toLowerCase().includes(s) ||
          w.code?.toLowerCase().includes(s)
      );
    }
    if (category) list = list.filter((w) => w.parentCategoryId?._id === category);
    if (city) list = list.filter((w) => w.address?.city?.toLowerCase() === city.toLowerCase());
    setFiltered(list);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteWarehouse(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const cities = [...new Set(warehouses.map((w) => w.address?.city).filter(Boolean))];
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  /* ── derived stats ── */
  const activeCount = warehouses.filter((w) => w.isActive).length;
  const inactiveCount = warehouses.length - activeCount;
  const cityCount = new Set(warehouses.map((w) => w.address?.city).filter(Boolean)).size;
  const hasFilters = search || category || city;

  /* ── page numbers array ── */
  const pageNums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pageNums.push(i);
    else if (Math.abs(i - page) === 2) pageNums.push("…");
  }
  const dedupedPages = pageNums.filter((v, i, a) => a[i - 1] !== v);

  return (
    <>
      <style>{`
        @keyframes wh-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes wh-fadein  { from { opacity:0 } to { opacity:1 } }
        @keyframes wh-popup   {
          from { opacity:0; transform:scale(.92) }
          to   { opacity:1; transform:scale(1)  }
        }
        .wh-row { transition: background .12s; }
        .wh-row:hover td { background: rgba(115,103,240,.03) !important; }
        .wh-action-btn {
          width: 32px; height: 32px; padding: 0;
          display:inline-flex; align-items:center; justify-content:center;
          border-radius: 8px; font-size: 14px; transition: all .15s;
          border: 1px solid transparent;
        }
        .wh-action-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.12); }
        .wh-search:focus { border-color:#7367f0; box-shadow:0 0 0 .2rem rgba(115,103,240,.18); }
        .wh-select:focus { border-color:#7367f0; box-shadow:0 0 0 .2rem rgba(115,103,240,.18); }
        .wh-pg-btn { width:34px; height:34px; padding:0; border-radius:8px;
          display:inline-flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:500; transition: all .15s; }
        .wh-pg-btn.active { background:#7367f0; border-color:#7367f0; color:#fff; }
        .wh-pg-btn:not(.active):not(:disabled):hover { border-color:#7367f0; color:#7367f0; }
        .wh-code-pill {
          font-family: 'Courier New', monospace; font-size: 11px; font-weight:700;
          letter-spacing:.5px; padding: 2px 8px; border-radius: 5px;
          background: rgba(115,103,240,.1); color: #7367f0;
        }
      `}</style>

      {/* confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}

      <div className="container-xxl container-p-y">

        {/* ── PAGE HEADER ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-buildings me-2 text-primary" />
              Warehouses
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Manage your storage locations and inventory hubs
            </p>
          </div>
          <Link to="new" className="btn btn-primary">
            <i className="bx bx-plus me-1" />
            Add Warehouse
          </Link>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="🏭" label="Total Warehouses" value={warehouses.length} accent="#7367f0" />
          <StatCard icon="✅" label="Active"           value={activeCount}        accent="#28c76f" />
          <StatCard icon="⏸️" label="Inactive"         value={inactiveCount}      accent="#ea5455" />
          <StatCard icon="📍" label="Cities Covered"   value={cityCount}          accent="#00cfe8" />
        </div>

        {/* ── FILTER BAR ── */}
        <div
          className="card mb-3"
          style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}
        >
          <div className="card-body py-3 px-4">
            <div className="row g-2 align-items-center">

              {/* search */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bx bx-search text-muted" />
                  </span>
                  <input
                    className="form-control border-start-0 wh-search"
                    placeholder="Search name or code…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                  {search && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setSearch("")}
                    >
                      <i className="bx bx-x" />
                    </button>
                  )}
                </div>
              </div>

              {/* category */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm wh-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ fontSize: 13 }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* city */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm wh-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ fontSize: 13 }}
                >
                  <option value="">All Locations</option>
                  {cities.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* clear */}
              <div className="col-12 col-md-2">
                <button
                  className="btn btn-sm w-100"
                  style={{
                    border: "1px solid #d1d5db",
                    color: hasFilters ? "#ea5455" : "#6e6b7b",
                    borderColor: hasFilters ? "#ea545530" : "#d1d5db",
                    background: hasFilters ? "#ea545508" : "transparent",
                    fontSize: 13,
                    transition: "all .15s",
                  }}
                  onClick={() => { setSearch(""); setCategory(""); setCity(""); }}
                >
                  <i className="bx bx-filter-alt me-1" />
                  {hasFilters ? "Clear" : "Reset"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── TABLE CARD ── */}
        <div className="card" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.06)", borderRadius: 12 }}>

          {/* card header */}
          <div
            className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Warehouse List</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              Showing {Math.min(start + 1, filtered.length)}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px", whiteSpace: "nowrap" }}>Warehouse</th>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px" }}>Code</th>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px" }}>Category</th>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px" }}>Location</th>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px" }}>Contact</th>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px" }}>Status</th>
                  <th style={{ fontWeight: 600, color: "#444", padding: "12px 16px", width: 100 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {/* loading */}
                {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

                {/* empty */}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div style={{ opacity: 0.5 }}>
                        <i className="bx bx-buildings d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                        <p className="mb-1 fw-semibold">No warehouses found</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                          {hasFilters ? "Try adjusting your filters" : "Add your first warehouse to get started"}
                        </p>
                        {hasFilters && (
                          <button
                            className="btn btn-sm btn-link mt-2 p-0"
                            onClick={() => { setSearch(""); setCategory(""); setCity(""); }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* rows */}
                {paginated.map((w, idx) => (
                  <tr
                    key={w._id}
                    className="wh-row"
                    style={{
                      borderBottom: "1px solid #f0f1f5",
                      animation: `wh-fadein .2s ease ${idx * 0.03}s both`,
                    }}
                  >
                    {/* name + street */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: 36,
                            height: 36,
                            background: "rgba(115,103,240,.1)",
                            fontSize: 17,
                          }}
                        >
                          🏭
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{w.name}</div>
                          {w.address?.street && (
                            <div className="text-muted" style={{ fontSize: 11.5 }}>
                              {w.address.street}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* code */}
                    <td style={{ padding: "13px 16px" }}>
                      <span className="wh-code-pill">{w.code}</span>
                    </td>

                    {/* category */}
                    <td style={{ padding: "13px 16px", color: "#555" }}>
                      {w.parentCategoryId?.name || (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* location */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex align-items-center gap-1">
                        <i className="bx bx-map-pin text-muted" style={{ fontSize: 13 }} />
                        <span>{w.address?.city || "—"}</span>
                      </div>
                      {w.address?.state && (
                        <div className="text-muted" style={{ fontSize: 11.5, paddingLeft: 18 }}>
                          {w.address.state}
                        </div>
                      )}
                    </td>

                    {/* contact */}
                    <td style={{ padding: "13px 16px" }}>
                      {w.contactPerson ? (
                        <>
                          <div className="fw-medium">{w.contactPerson}</div>
                          {w.contactPhone && (
                            <div className="text-muted" style={{ fontSize: 11.5 }}>
                              <i className="bx bx-phone me-1" style={{ fontSize: 11 }} />
                              {w.contactPhone}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* status */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle"
                          style={{
                            width: 7,
                            height: 7,
                            display: "inline-block",
                            background: w.isActive ? "#28c76f" : "#ea5455",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          className={`badge ${w.isActive ? "bg-label-success" : "bg-label-secondary"}`}
                          style={{ fontSize: 11 }}
                        >
                          {w.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* actions */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex gap-1">
                        <Link
                          to={w._id}
                          className="wh-action-btn btn btn-outline-primary"
                          title="Edit warehouse"
                        >
                          <i className="bx bx-edit-alt" />
                        </Link>
                        <button
                          className="wh-action-btn btn btn-outline-danger"
                          title="Delete warehouse"
                          onClick={() => setDeleteTarget({ id: w._id, name: w.name })}
                        >
                          <i className="bx bx-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          <div
            className="card-footer d-flex align-items-center justify-content-between py-3 px-4"
            style={{ borderTop: "1px solid #f0f1f5" }}
          >
            <div className="text-muted" style={{ fontSize: 12.5 }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              <span className="mx-1">·</span>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </div>

            <nav>
              <ul className="pagination pagination-sm mb-0 gap-1">
                {/* first */}
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="wh-pg-btn btn btn-outline-secondary" onClick={() => setPage(1)}>
                    <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="wh-pg-btn btn btn-outline-secondary" onClick={() => setPage((p) => p - 1)}>
                    <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                  </button>
                </li>

                {dedupedPages.map((pg, i) =>
                  pg === "…" ? (
                    <li key={`ellipsis-${i}`} className="page-item disabled">
                      <span className="wh-pg-btn btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                    </li>
                  ) : (
                    <li key={pg}>
                      <button
                        className={`wh-pg-btn btn btn-outline-secondary ${page === pg ? "active" : ""}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </button>
                    </li>
                  )
                )}

                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="wh-pg-btn btn btn-outline-secondary" onClick={() => setPage((p) => p + 1)}>
                    <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="wh-pg-btn btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
                    <i className="bx bx-chevrons-right" style={{ fontSize: 16 }} />
                  </button>
                </li>
              </ul>
            </nav>
          </div>

        </div>
      </div>
    </>
  );
}