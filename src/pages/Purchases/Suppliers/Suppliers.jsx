import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../../lib/suppliersAPI";

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[40, 80, 200, 160, 120, 110, 100].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div
          style={{
            height: 13,
            borderRadius: 6,
            width: w,
            maxWidth: "100%",
            background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
            backgroundSize: "200% 100%",
            animation: "sp-shimmer 1.4s infinite",
          }}
        />
      </td>
    ))}
  </tr>
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon, label, value, accent }) => (
  <div className="col-6 col-xl" style={{ minWidth: 130 }}>
    <div
      className="card h-100 mb-0"
      style={{
        borderTop: `3px solid ${accent}`,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
        transition: "all .18s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)";
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
   CONFIRM MODAL  (same as Products)
───────────────────────────────────────────── */
const ConfirmModal = ({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) => (
  <div
    style={{
      position: "fixed", inset: 0,
      background: "rgba(22,29,49,.46)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)",
      animation: "sp-fadein .15s ease",
    }}
  >
    <div
      className="card"
      style={{
        width: 400, borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,.22)",
        border: "none",
        animation: "sp-popup .2s cubic-bezier(.34,1.56,.64,1)",
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
   SUPPLIER AVATAR (initials)
───────────────────────────────────────────── */
const SupplierAvatar = ({ name }) => {
  const colors = ["#7367f0", "#28c76f", "#00cfe8", "#ff9f43", "#ea5455", "#82868b"];
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
export default function Suppliers() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers]   = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(false);

  const [filters, setFilters] = useState({ search: "", paymentTerms: "" });

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected]         = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // modal: { id, name } for single | "bulk" for bulk | null = closed
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [singleDeleting, setSingleDeleting] = useState(false);

  /* ── LOAD ───────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    setSelected(new Set());
    setPage(1);
    try {
      const res = await getSuppliers();
      if (res.data.success) {
        setSuppliers(res.data.data);
        setFiltered(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── FRONTEND FILTERS ───────────────────────────────────── */
  useEffect(() => {
    let data = [...suppliers];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q)
      );
    }

    if (filters.paymentTerms) {
      data = data.filter((s) => s.paymentTerms === filters.paymentTerms);
    }

    setFiltered(data);
    setPage(1);
    setSelected(new Set());
  }, [filters, suppliers]);

  /* ── PAGINATION ─────────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ── SELECTION ──────────────────────────────────────────── */
  const pageIds         = paginated.map((s) => s._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else                  pageIds.forEach((id) => next.add(id));
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

  /* ── DELETE SINGLE ──────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget || deleteTarget === "bulk") return;
    setSingleDeleting(true);
    try {
      await deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setSingleDeleting(false);
    }
  };

  /* ── BULK DELETE ────────────────────────────────────────── */
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => deleteSupplier(id)));
      setDeleteTarget(null);
      load();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetFilters = () => setFilters({ search: "", paymentTerms: "" });

  /* ── STATS ──────────────────────────────────────────────── */
  const totalCount     = filtered.length;
  const withEmailCount = filtered.filter((s) => s.email).length;
  const net30Count     = filtered.filter((s) => s.paymentTerms === "NET-30").length;

  const hasFilters = filters.search || filters.paymentTerms;

  /* ── PAGE NUMBERS ───────────────────────────────────────── */
  const buildPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (Math.abs(i - page) === 2) pages.push("…");
    }
    return pages.filter((v, i, a) => a[i - 1] !== v);
  };

  /* ── PAYMENT TERMS BADGE COLOR ──────────────────────────── */
  const termColor = (t = "") => {
    const n = parseInt(t.replace("NET-", ""), 10);
    if (n <= 10) return { bg: "bg-label-success", text: "" };
    if (n <= 20) return { bg: "bg-label-info",    text: "" };
    if (n <= 30) return { bg: "bg-label-primary",  text: "" };
    return           { bg: "bg-label-warning",  text: "" };
  };

  return (
    <>
      <style>{`
        @keyframes sp-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes sp-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes sp-popup   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes sp-rowslide { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .sp-row { transition: background .12s; }
        .sp-row:hover td { background: rgba(115,103,240,.03) !important; }
        .sp-row.selected td { background: rgba(115,103,240,.05) !important; }
        .sp-action { width:30px;height:30px;padding:0;display:inline-flex;align-items:center;
          justify-content:center;border-radius:8px;font-size:14px;transition:all .15s; }
        .sp-action:hover { transform:translateY(-1px); box-shadow:0 3px 8px rgba(0,0,0,.12); }
        .sp-search:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .sp-select:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .sp-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;
          align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .sp-pg.active  { background:#7367f0;border-color:#7367f0;color:#fff; }
        .sp-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
        .sp-cb { width:16px;height:16px;cursor:pointer;accent-color:#7367f0; }
        .sp-badge { font-size:11px;padding:3px 8px;border-radius:20px; }
      `}</style>

      {/* ── CONFIRM MODALS ── */}
      {deleteTarget && deleteTarget !== "bulk" && (
        <ConfirmModal
          title="Delete Supplier?"
          message={<>Supplier <strong>{deleteTarget.name}</strong> will be permanently deleted.</>}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => !singleDeleting && setDeleteTarget(null)}
          loading={singleDeleting}
        />
      )}
      {deleteTarget === "bulk" && (
        <ConfirmModal
          title={`Delete ${selected.size} Supplier${selected.size !== 1 ? "s" : ""}?`}
          message={`All ${selected.size} selected suppliers will be permanently deleted. This cannot be undone.`}
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
              <i className="bx bx-group me-2 text-primary" />
              Suppliers
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Manage your supplier directory, contacts and payment terms
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
              Add Supplier
            </Link>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="🏭" label="Total"        value={totalCount}     accent="#7367f0" />
          <StatCard icon="📧" label="With Email"   value={withEmailCount} accent="#28c76f" />
          {/* <StatCard icon="📋" label="NET-30"       value={net30Count}     accent="#00cfe8" />
          <StatCard icon="✅" label="On Page"      value={paginated.length} accent="#ff9f43" /> */}
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
                    placeholder="Search name or code…"
                    className="form-control border-start-0 sp-search"
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

              {/* payment terms */}
              <div className="col-6 col-md-auto" style={{ minWidth: 170 }}>
                <select
                  name="paymentTerms"
                  value={filters.paymentTerms}
                  onChange={handleFilterChange}
                  className="form-select form-select-sm sp-select"
                  style={{ fontSize: 13 }}
                >
                  <option value="">All Payment Terms</option>
                  {["NET-5","NET-10","NET-15","NET-20","NET-25","NET-30","NET-35","NET-40","NET-45","NET-50"].map((t) => (
                    <option key={t} value={t}>{t.replace("-", " ")}</option>
                  ))}
                </select>
              </div>

              {/* page size */}
              <div className="col-6 col-md-auto" style={{ minWidth: 110 }}>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="form-select form-select-sm sp-select"
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

          {/* card header */}
          <div
            className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Supplier List</span>
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
                    <input type="checkbox" className="sp-cb" checked={allPageSelected} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Code</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Supplier</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Contact</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Phone</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Payment Terms</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444", width: 90 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {/* loading skeletons */}
                {loading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

                {/* empty state */}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div style={{ opacity: 0.5 }}>
                        <i className="bx bx-group d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                        <p className="fw-semibold mb-1">No suppliers found</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                          {hasFilters ? "Try adjusting your filters" : "Add your first supplier to get started"}
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

                {/* data rows */}
                {!loading && paginated.map((s, idx) => (
                  <tr
                    key={s._id}
                    className={`sp-row ${selected.has(s._id) ? "selected" : ""}`}
                    style={{
                      borderBottom: "1px solid #f0f1f5",
                      animation: `sp-rowslide .2s ease ${idx * 0.025}s both`,
                    }}
                  >
                    {/* checkbox */}
                    <td style={{ padding: "13px 16px" }}>
                      <input type="checkbox" className="sp-cb" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)} />
                    </td>

                    {/* code */}
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          fontFamily: "monospace", fontSize: 11,
                          background: "rgba(115,103,240,.1)", color: "#7367f0",
                          padding: "2px 8px", borderRadius: 4,
                        }}
                      >
                        {s.code}
                      </span>
                    </td>

                    {/* supplier name + address */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex align-items-center gap-3">
                        <SupplierAvatar name={s.name} />
                        <div>
                          <div className="fw-semibold text-dark">{s.name}</div>
                          <div className="text-muted" style={{ fontSize: 11.5 }}>
                            {[s.address?.street, s.address?.city, s.address?.state, s.address?.pincode]
                              .filter(Boolean).join(", ") || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* contact */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="fw-semibold">{s.contactPerson || "—"}</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>{s.email || ""}</div>
                    </td>

                    {/* phone */}
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{s.phone || "—"}</span>
                    </td>

                    {/* payment terms */}
                    <td style={{ padding: "13px 16px" }}>
                      {s.paymentTerms ? (
                        <span className={`badge ${termColor(s.paymentTerms).bg} sp-badge`}>
                          {s.paymentTerms.replace("-", " ")}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* actions */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="d-flex gap-1">
                        <button
                          className="sp-action btn btn-outline-primary"
                          title="Edit supplier"
                          onClick={() => navigate(`${s._id}`)}
                        >
                          <i className="bx bx-edit-alt" />
                        </button>
                        <button
                          className="sp-action btn btn-outline-danger"
                          title="Delete supplier"
                          onClick={() => setDeleteTarget({ id: s._id, name: s.name })}
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
                  <button className="sp-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                    <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="sp-pg btn btn-outline-secondary" onClick={() => setPage((p) => p - 1)}>
                    <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                  </button>
                </li>

                {buildPages().map((pg, i) =>
                  pg === "…" ? (
                    <li key={`e${i}`} className="page-item disabled">
                      <span className="sp-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                    </li>
                  ) : (
                    <li key={pg}>
                      <button
                        className={`sp-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </button>
                    </li>
                  )
                )}

                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="sp-pg btn btn-outline-secondary" onClick={() => setPage((p) => p + 1)}>
                    <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="sp-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
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