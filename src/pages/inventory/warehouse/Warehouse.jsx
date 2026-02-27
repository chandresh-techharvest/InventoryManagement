import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getWarehouses,
  deleteWarehouse
} from "../../../lib/WarehouseAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [warehouses, search, category, city]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [wRes, cRes] = await Promise.all([
        getWarehouses(),
        getParentCategories()
      ]);

      setWarehouses(wRes.data.data || []);
      setCategories(cRes.data.data || []);
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let list = [...warehouses];

    // search name + code
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.name?.toLowerCase().includes(s) ||
          w.code?.toLowerCase().includes(s)
      );
    }

    // category filter
    if (category) {
      list = list.filter(
        (w) => w.parentCategoryId?._id === category
      );
    }

    // city filter
    if (city) {
      list = list.filter(
        (w) =>
          w.address?.city?.toLowerCase() ===
          city.toLowerCase()
      );
    }

    setFiltered(list);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this warehouse?"))
      return;

    try {
      await deleteWarehouse(id);
      loadData();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Delete failed"
      );
    }
  };

  // unique cities for dropdown
  const cities = [
    ...new Set(
      warehouses
        .map((w) => w.address?.city)
        .filter(Boolean)
    )
  ];

  // pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(
    start,
    start + pageSize
  );

  return (
    <div className="container-xxl container-p-y">
      <div className="card shadow-sm">

        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Warehouses</h5>
          <Link to="new" className="btn btn-primary">
            + Add Warehouse
          </Link>
        </div>

        {/* FILTER BAR */}
        <div className="card-body border-bottom">
          <div className="row g-2">

            {/* search */}
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Search name or code..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            {/* category */}
            <div className="col-md-3">
              <select
                className="form-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <option value="">
                  All Categories
                </option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* city */}
            <div className="col-md-3">
              <select
                className="form-select"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
              >
                <option value="">
                  All Locations
                </option>
                {cities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            {/* reset */}
            <div className="col-md-2">
              <button
                className="btn btn-label-secondary w-100"
                style={{ borderColor: "#ced4da" }}
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                }}
              >
                Reset
              </button>
            </div>

          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Warehouse</th>
                <th>Code</th>
                <th>Category</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ width: 160 }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                paginated.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No warehouses found
                    </td>
                  </tr>
                )}

              {paginated.map((w) => (
                <tr key={w._id}>
                  <td>
                    <div className="fw-semibold">
                      {w.name}
                    </div>
                    <small className="text-muted">
                      {w.address?.street}
                    </small>
                  </td>

                  <td>{w.code}</td>

                  <td>
                    {w.parentCategoryId?.name || "-"}
                  </td>

                  <td>
                    {w.address?.city}
                    <div className="text-muted small">
                      {w.address?.state}
                    </div>
                  </td>

                  <td>
                    {w.contactPerson}
                    <div className="text-muted small">
                      {w.contactPhone}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        w.isActive
                          ? "bg-label-success"
                          : "bg-label-secondary"
                      }`}
                    >
                      {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        to={w._id}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Edit
                      </Link>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          handleDelete(w._id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ALWAYS VISIBLE PAGINATION */}
        <div className="card-footer d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            Page {page} of {totalPages} •{" "}
            {filtered.length} records
          </div>

          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === 1}
              onClick={() =>
                setPage((p) => p - 1)
              }
            >
              Prev
            </button>

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === totalPages}
              onClick={() =>
                setPage((p) => p + 1)
              }
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}