import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWarehouses, deleteWarehouse } from "../../../lib/WarehouseAPI";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);

  const loadWarehouses = async () => {
    const { data } = await getWarehouses();
    setWarehouses(data.data || []);
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this warehouse?")) return;
    await deleteWarehouse(id);
    loadWarehouses();
  };

  return (
    <div className="container-xxl container-p-y">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">Warehouses</h5>
            <small className="text-muted">
              Manage inventory locations
            </small>
          </div>

          {/* ✅ relative route */}
          <Link to="new" className="btn btn-primary">
            + Add Warehouse
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {warehouses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No warehouses found
                  </td>
                </tr>
              )}

              {warehouses.map((w) => (
                <tr key={w._id}>
                  <td>
                    <div className="fw-semibold">{w.name}</div>
                    <small className="text-muted">
                      {w.address?.street}
                    </small>
                  </td>

                  <td>{w.code}</td>

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

                  {/* ✅ Edit route = :id */}
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
                        onClick={() => handleDelete(w._id)}
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
      </div>
    </div>
  );
}