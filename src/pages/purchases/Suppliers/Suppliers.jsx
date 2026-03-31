import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../../lib/suppliersAPI";

export default function Suppliers() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    paymentTerms: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // LOAD ALL SUPPLIERS
  const load = async () => {
    setLoading(true);

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

  useEffect(() => {
    load();
  }, []);

  // APPLY FRONTEND FILTERS
  useEffect(() => {
    let data = [...suppliers];

    if (filters.search) {
      data = data.filter((s) =>
        s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.code.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.paymentTerms) {
      data = data.filter(
        (s) => s.paymentTerms === filters.paymentTerms
      );
    }

    setFiltered(data);
    setPage(1);
  }, [filters, suppliers]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // SELECTION
  const pageIds = paginated.map((p) => p._id);

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }

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

  // DELETE
  const handleDelete = async (id) => {
    await deleteSupplier(id);
    load();
    setSelected(new Set()); 
    setShowDeleteModal(false);
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);

    try {
      await Promise.all([...selected].map((id) => deleteSupplier(id)));
      load();
      setSelected(new Set()); 
    } finally {
      setBulkDeleting(false);
    }
  };

  // FILTER CHANGE
  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      paymentTerms: "",
    });
  };

  const confirmDelete = async () => {
    if (selectedSupplier) {
      await handleDelete(selectedSupplier);
      setSelectedSupplier("");
    } else {
      await handleBulkDelete();
    }

    setShowDeleteModal(false);
  };

  return (
    <div className="container-xxl container-p-y">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Suppliers</h4>

        <div className="d-flex gap-2">
          {selected.size > 0 && (
            <button
              className="btn btn-danger"
              disabled={bulkDeleting}
              onClick={() => {
                setSelectedSupplier("");
                setShowDeleteModal(true);
              }}
            >
              {bulkDeleting
                ? "Deleting..."
                : `Delete (${selected.size})`}
            </button>
          )}

          <Link to="new" className="btn btn-primary">
            <i className="bx bx-plus me-1"></i> Add Supplier
          </Link>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">

            <div className="col-12 col-md-auto flex-md-grow-1">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search supplier name, code"
                className="form-control"
              />
            </div>

            <div className="col-6 col-md-auto">
              <select
                name="paymentTerms"
                value={filters.paymentTerms}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Payment Terms</option>
                <option value="NET-5">NET 5</option>
                <option value="NET-10">NET 10</option>
                <option value="NET-15">NET 15</option>
                <option value="NET-20">NET 20</option>
                <option value="NET-25">NET 25</option>
                <option value="NET-30">NET 30</option>
                <option value="NET-35">NET 35</option>
                <option value="NET-40">NET 40</option>
                <option value="NET-45">NET 45</option>
                <option value="NET-50">NET 50</option>
              </select>
            </div>

            <div className="col-6 col-md-auto">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle table-hover">

            <thead className="table-light">
              <tr>
                <th width="40">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Code</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Payment Terms</th>
                <th width="140">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No Supplier found
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(s._id)}
                        onChange={() => toggleSelect(s._id)}
                      />
                    </td>

                    <td>{s.code}</td>

                    <td>
                      <div className="fw-semibold">{s.name}</div>
                      <small className="text-muted">
                        {s.address?.street || " "},{" "}
                        {s.address?.city || " "},{" "}
                        {s.address?.state || ""},{" "}
                        {s.address?.pincode || ""}
                      </small>
                    </td>

                    <td>
                      <div>{s.contactPerson || "-"}</div>
                      <small className="text-muted">{s.email}</small>
                    </td>

                    <td>{s.phone}</td>

                    <td>{s.paymentTerms}</td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`${s._id}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            setShowDeleteModal(true)
                            setSelectedSupplier(s._id);
                          }

                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <div className="card-footer d-flex justify-content-between">

            <span className="text-muted">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>

            <div className="btn-group">

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                «
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </button>

            </div>

          </div>
        )}

      </div>

      {showDeleteModal && (
        <div className="modal show d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Delete Supplier
                </h5>
              </div>

              <div className="modal-body">
                {selected ? `Are you sure you want to delete ${selected.size} suppliers?` : "Are you sure you want to delete this supplier?"}
                
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-danger"
                  onClick={confirmDelete}
                >
                  Delete
                </button>

              </div>

            </div>

          </div>

        </div>

      )}
    </div>
  );
}