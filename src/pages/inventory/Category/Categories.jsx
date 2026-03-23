import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, deleteCategory } from "../../../lib/categoryAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";
import { getProducts } from "../../../lib/productApi";

/* ─── Skeleton ───────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[200, 120, 70, 70, 90, 100].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div style={{
          height: 13, borderRadius: 6, width: w,
          background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
          backgroundSize: "200% 100%", animation: "cat-shimmer 1.4s infinite",
        }} />
      </td>
    ))}
  </tr>
);

/* ─── Stat Card ──────────────────────────────── */
const StatCard = ({ icon, label, value, accent }) => (
  <div className="col-6 col-xl-3">
    <div
      className="card h-100 mb-0"
      style={{ borderTop: `3px solid ${accent}`, boxShadow: "0 1px 8px rgba(0,0,0,.06)", transition: "all .18s", cursor: "default" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)"; }}
    >
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 42, height: 42, background: accent + "18", fontSize: 19 }}
        >{icon}</div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 11.5 }}>{label}</p>
          <h4 className="mb-0 fw-bold" style={{ letterSpacing: "-0.5px" }}>{value}</h4>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Confirm Modal ──────────────────────────── */
const ConfirmModal = ({ name, onConfirm, onCancel, loading }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(22,29,49,.46)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(2px)", animation: "cat-fadein .15s ease",
  }}>
    <div className="card" style={{ width: 400, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.22)", border: "none", animation: "cat-popup .2s cubic-bezier(.34,1.56,.64,1)" }}>
      <div className="card-body p-4 text-center">
        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: 54, height: 54, background: "rgba(234,84,85,.1)", fontSize: 24 }}>🗑️</div>
        <h5 className="fw-bold mb-1">Delete Category?</h5>
        <p className="text-muted mb-4" style={{ fontSize: 13.5 }}>
          <strong>{name}</strong> will be permanently removed.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger px-4" onClick={onConfirm} disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 13, height: 13 }} />Deleting…</>
              : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Avatar ─────────────────────────────────── */
const CatAvatar = ({ name }) => {
  const colors = ["#7367f0", "#28c76f", "#00cfe8", "#ff9f43", "#ea5455"];
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
      style={{ width: 34, height: 34, background: c + "18", color: c, fontSize: 13 }}>
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
};

/* ─── Main ───────────────────────────────────── */
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [parents, setParents]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // ✅ productCountMap: { categoryId → count } built from products API
  const [productCountMap, setProductCountMap] = useState({});

  const [search, setSearch]               = useState("");
  const [parentFilter, setParentFilter]   = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [page, setPage]                   = useState(1);
  const pageSize = 10;

  /* UI-only */
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting]         = useState(false);

  /* ── original logic unchanged ── */
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.data.success) setCategories(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  const loadParents = async () => {
    const res = await getParentCategories();
    setParents(res.data.data || []);
  };

  // ✅ FIX: Build product count map from products API
  // Backend Category model doesn't store productCount as a field —
  // it must be aggregated. We fetch all products once and count by categoryId.
  const loadProductCounts = async () => {
    try {
      const res = await getProducts();
      if (res.data.success) {
        const map = {};
        (res.data.data || []).forEach((p) => {
          const cid = p.categoryId?._id || p.categoryId;
          if (cid) map[cid] = (map[cid] || 0) + 1;
        });
        setProductCountMap(map);
      }
    } catch (err) {
      console.error("Product count load error:", err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadParents();
    loadProductCounts();
  }, []);

  /* filter logic — original unchanged */
  const filtered = categories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchParent = parentFilter ? c.parentCategoryId?._id === parentFilter : true;
    const matchStatus = statusFilter === "" ? true : statusFilter === "active" ? c.isActive : !c.isActive;
    return matchSearch && matchParent && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, parentFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      loadCategories();
      loadProductCounts();
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => { setSearch(""); setParentFilter(""); setStatusFilter(""); };

  /* derived stats */
  const activeCount   = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;
  const parentCount   = new Set(categories.map((c) => c.parentCategoryId?._id).filter(Boolean)).size;
  const hasFilters    = search || parentFilter || statusFilter;

  /* page number builder */
  const buildPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (Math.abs(i - page) === 2) pages.push("…");
    }
    return pages.filter((v, i, a) => a[i - 1] !== v);
  };

  return (
    <>
      <style>{`
        @keyframes cat-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes cat-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes cat-popup   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes cat-row     { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .cat-row { transition:background .12s; }
        .cat-row:hover td { background:rgba(115,103,240,.03)!important; }
        .cat-act { width:30px;height:30px;padding:0;display:inline-flex;align-items:center;
          justify-content:center;border-radius:8px;font-size:14px;transition:all .15s; }
        .cat-act:hover { transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.12); }
        .cat-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .cat-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;
          align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .cat-pg.active { background:#7367f0;border-color:#7367f0;color:#fff; }
        .cat-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
      `}</style>

      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="container-xxl flex-grow-1 container-p-y">

        {/* ── Header ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-category me-2 text-primary" />Sub-Categories
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Manage product sub-categories and their parent groups
            </p>
          </div>
          <Link to="new" className="btn btn-primary btn-sm">
            <i className="bx bx-plus me-1" />Add Category
          </Link>
        </div>

        {/* ── Stat Cards ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="🗂️" label="Total"        value={categories.length} accent="#7367f0" />
          <StatCard icon="✅" label="Active"        value={activeCount}       accent="#28c76f" />
          <StatCard icon="⏸️" label="Inactive"      value={inactiveCount}     accent="#ea5455" />
          <StatCard icon="📁" label="Parents Used"  value={parentCount}       accent="#00cfe8" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-3 px-4">
            <div className="row g-2 align-items-center">

              <div className="col-12 col-md-5">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bx bx-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 cat-inp"
                    placeholder="Search category name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                  {search && (
                    <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}>
                      <i className="bx bx-x" />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm cat-inp" value={parentFilter}
                  onChange={(e) => setParentFilter(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">All Parents</option>
                  {parents.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select className="form-select form-select-sm cat-inp" value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <button
                  className="btn btn-sm w-100"
                  onClick={resetFilters}
                  style={{
                    border: `1px solid ${hasFilters ? "#ea545530" : "#d1d5db"}`,
                    color: hasFilters ? "#ea5455" : "#6e6b7b",
                    background: hasFilters ? "#ea545508" : "transparent",
                    fontSize: 13, transition: "all .15s",
                  }}
                >
                  <i className="bx bx-filter-alt me-1" />{hasFilters ? "Clear" : "Reset"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="card" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.06)", borderRadius: 12 }}>

          <div className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Category List</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  {["Category", "Parent", "Products", "Status", "Created", "Actions"].map((h, i) => (
                    <th key={h} style={{ padding: "12px 16px", fontWeight: 600, color: "#444", width: i === 5 ? 100 : "auto" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div style={{ opacity: 0.5 }}>
                        <i className="bx bx-category d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                        <p className="fw-semibold mb-1">No categories found</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                          {hasFilters ? "Try adjusting your filters" : "Add your first category to get started"}
                        </p>
                        {hasFilters && (
                          <button className="btn btn-link btn-sm mt-1 p-0" onClick={resetFilters}>Clear filters</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && paginated.map((c, idx) => {
                  // ✅ FIX: use productCountMap (built from products API) instead of c.productCount
                  const productCount = productCountMap[c._id] || 0;

                  return (
                    <tr key={c._id} className="cat-row"
                      style={{ borderBottom: "1px solid #f0f1f5", animation: `cat-row .2s ease ${idx * 0.03}s both` }}>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-3">
                          <CatAvatar name={c.name} />
                          <div>
                            <div className="fw-semibold text-dark">{c.name}</div>
                            {c.description && (
                              <div className="text-muted" style={{ fontSize: 11.5, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {c.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        {c.parentCategoryId?.name ? (
                          <span className="badge bg-label-secondary" style={{ fontSize: 11 }}>
                            <i className="bx bx-folder me-1" style={{ fontSize: 11 }} />
                            {c.parentCategoryId.name}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        {productCount > 0 ? (
                          <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                            <i className="bx bx-cube me-1" style={{ fontSize: 11 }} />
                            {productCount} product{productCount !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="badge bg-label-secondary" style={{ fontSize: 11, opacity: 0.6 }}>
                            No products
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 7, height: 7, display: "inline-block", background: c.isActive ? "#28c76f" : "#ea5455" }} />
                          <span className={`badge ${c.isActive ? "bg-label-success" : "bg-label-secondary"}`} style={{ fontSize: 11 }}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px", color: "#888", fontSize: 12.5 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "—"}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex gap-1">
                          <Link to={`${c._id}/`} className="cat-act btn btn-outline-primary" title="Edit">
                            <i className="bx bx-edit-alt" />
                          </Link>
                          <button
                            className="cat-act btn btn-outline-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget({ id: c._id, name: c.name })}
                          >
                            <i className="bx bx-trash" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="card-footer d-flex align-items-center justify-content-between py-3 px-4"
              style={{ borderTop: "1px solid #f0f1f5" }}>
              <span className="text-muted" style={{ fontSize: 12.5 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {filtered.length} records
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="cat-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                      <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="cat-pg btn btn-outline-secondary" onClick={() => setPage(p => p - 1)}>
                      <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  {buildPages().map((pg, i) =>
                    pg === "…" ? (
                      <li key={`e${i}`} className="page-item disabled">
                        <span className="cat-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                      </li>
                    ) : (
                      <li key={pg}>
                        <button
                          className={`cat-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`}
                          onClick={() => setPage(pg)}
                        >{pg}</button>
                      </li>
                    )
                  )}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="cat-pg btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}>
                      <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="cat-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
                      <i className="bx bx-chevrons-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}