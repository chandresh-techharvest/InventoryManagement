import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../../../lib/productApi";
import { getCategories } from "../../../lib/categoryAPI";

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[40, 220, 100, 80, 60, 70, 100].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div
          style={{
            height: 13,
            borderRadius: 6,
            width: w,
            maxWidth: "100%",
            background:
              "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
            backgroundSize: "200% 100%",
            animation: "pr-shimmer 1.4s infinite",
          }}
        />
      </td>
    ))}
  </tr>
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon, label, value, accent, onClick, active }) => (
  <div className="col-6 col-xl" style={{ minWidth: 120 }}>
    <div
      className="card h-100 mb-0"
      onClick={onClick}
      style={{
        borderTop: `3px solid ${accent}`,
        boxShadow: active
          ? `0 4px 16px ${accent}30`
          : "0 1px 8px rgba(0,0,0,.06)",
        transition: "all .18s",
        cursor: onClick ? "pointer" : "default",
        transform: active ? "translateY(-2px)" : "none",
        background: active ? `${accent}06` : "#fff",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)";
        }
      }}
    >
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 42, height: 42, background: accent + "18", fontSize: 19 }}
        >
          {icon}
        </div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 11.5, lineHeight: 1.3 }}>
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

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
const ConfirmModal = ({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) => (
  <div
    style={{
      position: "fixed", inset: 0,
      background: "rgba(22,29,49,.46)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)",
      animation: "pr-fadein .15s ease",
    }}
  >
    <div
      className="card"
      style={{
        width: 400, borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,.22)",
        border: "none",
        animation: "pr-popup .2s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <div className="card-body p-4 text-center">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: 54, height: 54, background: danger ? "rgba(234,84,85,.1)" : "rgba(255,159,67,.1)", fontSize: 24 }}
        >
          {danger ? "🗑️" : "⚠️"}
        </div>
        <h5 className="fw-bold mb-1">{title}</h5>
        <p className="text-muted mb-4" style={{ fontSize: 13.5 }}>{message}</p>
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-warning"} px-4`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" style={{ width: 13, height: 13 }} />{confirmLabel}…</>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   PRODUCT AVATAR (initials)
───────────────────────────────────────────── */
const ProductAvatar = ({ name }) => {
  const colors = ["#7367f0","#28c76f","#00cfe8","#ff9f43","#ea5455","#82868b"];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
      style={{
        width: 36, height: 36,
        background: colors[idx] + "18",
        color: colors[idx],
        fontSize: 13, fontFamily: "monospace",
      }}
    >
      {initials}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Products() {
  const navigate = useNavigate();

  /* ── all original state unchanged ── */
  const [products, setProducts]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);

  const [filters, setFilters] = useState({
    search: "", status: "", categoryId: "", stock: "",
  });

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected]         = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  /* UI-only state */
  const [deleteTarget, setDeleteTarget]   = useState(null); // { id, name } | "bulk"
  const [singleDeleting, setSingleDeleting] = useState(false);

  /* ── all original logic unchanged ── */
  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    setPage(1);
    try {
      const params = {};
      if (filters.search)     params.search     = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.status !== "") params.isActive = filters.status === "active";
      const res = await getProducts(params);
      if (res.data.success) setProducts(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.categoryId, filters.status]);

  useEffect(() => {
    let data = [...products];
    if (filters.stock === "in")  data = data.filter((p) => (p.stock ?? 0) > 0);
    if (filters.stock === "out") data = data.filter((p) => (p.stock ?? 0) <= 0);
    setFiltered(data);
    setPage(1);
    setSelected(new Set());
  }, [products, filters.stock]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.data.success) setCategories(res.data.data);
    });
  }, []);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* selection */
  const pageIds        = paginated.map((p) => p._id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else                 pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* delete — now uses modal */
  const handleDelete = async () => {
    if (!deleteTarget || deleteTarget === "bulk") return;
    setSingleDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setSingleDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => deleteProduct(id)));
      setDeleteTarget(null);
      load();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "", categoryId: "", stock: "" });
  };

  /* derived stats */
  const totalCount    = filtered.length;
  const activeCount   = filtered.filter((p) => p.isActive).length;
  const inStockCount  = filtered.filter((p) => (p.stock ?? 0) > 0).length;
  const outStockCount = filtered.filter((p) => (p.stock ?? 0) <= 0).length;

  const hasFilters = filters.search || filters.status || filters.categoryId || filters.stock;

  /* page number array */
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
        @keyframes pr-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pr-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes pr-popup   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes pr-rowslide { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .pr-row { transition: background .12s; }
        .pr-row:hover td { background: rgba(115,103,240,.03) !important; }
        .pr-row.selected td { background: rgba(115,103,240,.05) !important; }
        .pr-action { width:30px;height:30px;padding:0;display:inline-flex;align-items:center;
          justify-content:center;border-radius:8px;font-size:14px;transition:all .15s; }
        .pr-action:hover { transform:translateY(-1px); box-shadow:0 3px 8px rgba(0,0,0,.12); }
        .pr-search:focus  { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pr-select:focus  { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pr-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;
          align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .pr-pg.active  { background:#7367f0;border-color:#7367f0;color:#fff; }
        .pr-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
        .pr-cb { width:16px;height:16px;cursor:pointer;accent-color:#7367f0; }
        .pr-badge-cat { font-size:11px;padding:3px 8px;border-radius:20px; }
      `}</style>

      {/* ── confirm modals ── */}
      {deleteTarget && deleteTarget !== "bulk" && (
        <ConfirmModal
          title="Delete Product?"
          message={<>Product <strong>{deleteTarget.name}</strong> will be permanently deleted.</>}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => !singleDeleting && setDeleteTarget(null)}
          loading={singleDeleting}
        />
      )}
      {deleteTarget === "bulk" && (
        <ConfirmModal
          title={`Delete ${selected.size} Products?`}
          message={`All ${selected.size} selected products will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete All"
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => !bulkDeleting && setDeleteTarget(null)}
          loading={bulkDeleting}
        />
      )}

      <div className="container-xxl container-p-y">

        {/* ── PAGE HEADER ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-cube me-2 text-primary" />
              Products
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Manage your product catalogue, variants and stock status
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {selected.size > 0 && (
              <button
                className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                onClick={() => setDeleteTarget("bulk")}
                disabled={bulkDeleting}
              >
                <i className="bx bx-trash" />
                Delete
                <span
                  className="rounded-pill d-flex align-items-center justify-content-center"
                  style={{ width: 20, height: 20, background: "rgba(255,255,255,.25)", fontSize: 11, fontWeight: 700 }}
                >
                  {selected.size}
                </span>
              </button>
            )}
            <Link to="new" className="btn btn-primary btn-sm">
              <i className="bx bx-plus me-1" />
              Add Product
            </Link>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="📦" label="Total"     value={totalCount}    accent="#7367f0" />
          <StatCard icon="✅" label="Active"    value={activeCount}   accent="#28c76f" />
          <StatCard icon="🔴" label="Inactive"  value={totalCount - activeCount} accent="#ea5455" />
          <StatCard icon="📈" label="In Stock"  value={inStockCount}  accent="#00cfe8" />
          <StatCard icon="🚫" label="Out of Stock" value={outStockCount} accent="#ff9f43" />
        </div>

        {/* ── FILTER BAR ── */}
        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-3 px-4">
            <div className="row g-2 align-items-center">

              {/* search */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bx bx-search text-muted" />
                  </span>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search name or SKU…"
                    className="form-control border-start-0 pr-search"
                    style={{ fontSize: 13 }}
                  />
                  {filters.search && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setFilters((p) => ({ ...p, search: "" }))}
                    >
                      <i className="bx bx-x" />
                    </button>
                  )}
                </div>
              </div>

              {/* category */}
              <div className="col-6 col-md-auto" style={{ minWidth: 160 }}>
                <select name="categoryId" value={filters.categoryId}
                  onChange={handleFilterChange}
                  className="form-select form-select-sm pr-select"
                  style={{ fontSize: 13 }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* status */}
              <div className="col-6 col-md-auto" style={{ minWidth: 140 }}>
                <select name="status" value={filters.status}
                  onChange={handleFilterChange}
                  className="form-select form-select-sm pr-select"
                  style={{ fontSize: 13 }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* stock */}
              <div className="col-6 col-md-auto" style={{ minWidth: 140 }}>
                <select name="stock" value={filters.stock}
                  onChange={handleFilterChange}
                  className="form-select form-select-sm pr-select"
                  style={{ fontSize: 13 }}
                >
                  <option value="">All Stock</option>
                  <option value="in">In Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              {/* page size */}
              <div className="col-6 col-md-auto" style={{ minWidth: 110 }}>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="form-select form-select-sm pr-select"
                  style={{ fontSize: 13 }}
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>Show {n}</option>
                  ))}
                </select>
              </div>

              {/* clear */}
              <div className="col-6 col-md-auto ms-md-auto">
                <button
                  className="btn btn-sm w-100"
                  style={{
                    border: `1px solid ${hasFilters ? "#ea545530" : "#d1d5db"}`,
                    color: hasFilters ? "#ea5455" : "#6e6b7b",
                    background: hasFilters ? "#ea545508" : "transparent",
                    fontSize: 13, transition: "all .15s",
                  }}
                  onClick={resetFilters}
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

          {/* header */}
          <div
            className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Product List</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              </span>
              {selected.size > 0 && (
                <span className="badge bg-label-warning" style={{ fontSize: 11 }}>
                  {selected.size} selected
                </span>
              )}
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  <th style={{ padding: "12px 16px", width: 44 }}>
                    <input
                      type="checkbox"
                      className="pr-cb"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Product</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Category</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Variants</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Stock</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444", width: 90 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {/* loading */}
                {loading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

                {/* empty */}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div style={{ opacity: 0.5 }}>
                        <i className="bx bx-cube d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                        <p className="fw-semibold mb-1">No products found</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                          {hasFilters ? "Try adjusting your filters" : "Add your first product to get started"}
                        </p>
                        {hasFilters && (
                          <button className="btn btn-sm btn-link mt-2 p-0" onClick={resetFilters}>
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* rows */}
                {!loading && paginated.map((p, idx) => (
                  <tr
                    key={p._id}
                    className={`pr-row ${selected.has(p._id) ? "selected" : ""}`}
                    style={{
                      borderBottom: "1px solid #f0f1f5",
                      animation: `pr-rowslide .2s ease ${idx * 0.025}s both`,
                    }}
                  >
                    {/* checkbox */}
                    <td style={{ padding: "13px 16px" }}>
                      <input
                        type="checkbox"
                        className="pr-cb"
                        checked={selected.has(p._id)}
                        onChange={() => toggleSelect(p._id)}
                      />
                    </td>

                    {/* product */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex align-items-center gap-3">
                        <ProductAvatar name={p.name} />
                        <div>
                          <div className="fw-semibold text-dark">{p.name}</div>
                          <div className="text-muted" style={{ fontSize: 11.5 }}>
                            <span
                              style={{
                                fontFamily: "monospace", fontSize: 11,
                                background: "rgba(115,103,240,.1)", color: "#7367f0",
                                padding: "1px 6px", borderRadius: 4, marginRight: 6,
                              }}
                            >
                              {p.sku}
                            </span>
                            {p.brand && <span>{p.brand}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* category */}
                    <td style={{ padding: "13px 16px" }}>
                      {p.categoryId?.name ? (
                        <span className="badge bg-label-primary pr-badge-cat">
                          {p.categoryId.name}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* variants */}
                    <td style={{ padding: "13px 16px" }}>
                      {p.variants?.length > 0 ? (
                        <span className="badge bg-label-info pr-badge-cat">
                          <i className="bx bx-layer me-1" style={{ fontSize: 11 }} />
                          {p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* stock */}
                    <td style={{ padding: "13px 16px" }}>
                      {(p.stock ?? 0) > 0 ? (
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 7, height: 7, background: "#28c76f", display: "inline-block" }} />
                          <span className="fw-semibold text-success">{p.stock}</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 7, height: 7, background: "#ea5455", display: "inline-block" }} />
                          <span className="fw-semibold text-danger">Out</span>
                        </div>
                      )}
                    </td>

                    {/* status */}
                    <td style={{ padding: "13px 16px" }}>
                      <span className={`badge ${p.isActive ? "bg-label-success" : "bg-label-secondary"} pr-badge-cat`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* actions */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex gap-1">
                        <button
                          className="pr-action btn btn-outline-primary"
                          title="Edit product"
                          onClick={() => navigate(`${p._id}`)}
                        >
                          <i className="bx bx-edit-alt" />
                        </button>
                        <button
                          className="pr-action btn btn-outline-danger"
                          title="Delete product"
                          onClick={() => setDeleteTarget({ id: p._id, name: p.name })}
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
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="pr-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                    <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="pr-pg btn btn-outline-secondary" onClick={() => setPage((p) => p - 1)}>
                    <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                  </button>
                </li>

                {buildPages().map((pg, i) =>
                  pg === "…" ? (
                    <li key={`e${i}`} className="page-item disabled">
                      <span className="pr-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                    </li>
                  ) : (
                    <li key={pg}>
                      <button
                        className={`pr-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </button>
                    </li>
                  )
                )}

                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="pr-pg btn btn-outline-secondary" onClick={() => setPage((p) => p + 1)}>
                    <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="pr-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
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