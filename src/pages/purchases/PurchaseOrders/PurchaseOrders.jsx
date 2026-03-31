import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPurchaseOrders } from "../../../lib/purchaseOrdersAPI";

export default function PurchaseOrders() {
  const navigate = useNavigate();

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // LOAD ALL PURCHASEORDERS
  const loadOrders = async () => {
    setLoading(true);

    try {
      const res = await getPurchaseOrders();

      if (res.data.success) {
        setPurchaseOrders(res.data.data);
        console.log(res.data.data);
        setFiltered(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // APPLY FRONTEND FILTERS
  useEffect(() => {
    let data = [...purchaseOrders];

    if (filters.search) {
      data = data.filter((po) =>
        // s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        po.poNumber.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      data = data.filter(
        (po) => po.status === filters.status
      );
    }

    setFiltered(data);
    setPage(1);
  }, [filters, purchaseOrders]);

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

  return (
    <div className="container-xxl container-p-y">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Purchase Orders</h4>

        <div className="d-flex gap-2">
          <Link to="new" className="btn btn-primary">
            <i className="bx bx-plus me-1"></i> Add Purchase Order
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
                placeholder="Search poNumber..."
                className="form-control"
              />
            </div>

            <div className="col-6 col-md-auto">
              <select
                name="status"
                value={filters.paymentTerms}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="received">Partially Recieved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                <th>poNumber</th>
                <th>Supplier</th>
                <th>Items Quantity</th>
                <th>Total Amount</th>
                <th>Status</th>
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
                    No Purchase Order found
                  </td>
                </tr>
              ) : (
                paginated.map((po) => (
                  <tr key={po._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(po._id)}
                        onChange={() => toggleSelect(po._id)}
                      />
                    </td>

                    <td>{po.poNumber}</td>

                    <td>
                      <div className="fw-semibold">{po.supplierId.name}</div>
                      <small className="text-muted">
                        {po.supplierId?.code || ""}
                      </small>
                    </td>

                    <td>
                      <div>{po.items.length || "-"}</div>
                    </td>

                    <td>{po.totalAmount}</td>

                    <td>{po.status}</td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`${po._id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`${po._id}`)}
                        >
                          Status
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

    </div>
  );
}