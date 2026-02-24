import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createWarehouse,
  getWarehouse,
  updateWarehouse
} from "../../../lib/WarehouseAPI";

export default function WarehouseForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const emptyForm = {
    name: "",
    code: "",
    contactPerson: "",
    contactPhone: "",
    isActive: true,
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India"
    }
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (id) loadWarehouse();
  }, [id]);

  const loadWarehouse = async () => {
    const { data } = await getWarehouse(id);
    setForm(data.data);
  };

  const handleAddress = (field, value) => {
    setForm({
      ...form,
      address: { ...form.address, [field]: value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (id) {
      await updateWarehouse(id, form);
    } else {
      await createWarehouse(form);
    }

    navigate("/inventory/warehouses");
  };

  return (
    <div className="container-xxl container-p-y">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            {id ? "Edit Warehouse" : "Add Warehouse"}
          </h5>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Code</label>
                <input
                  className="form-control"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Contact Person</label>
                <input
                  className="form-control"
                  value={form.contactPerson || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contactPerson: e.target.value
                    })
                  }
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Contact Phone</label>
                <input
                  className="form-control"
                  value={form.contactPhone || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contactPhone: e.target.value
                    })
                  }
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label">Street</label>
                <input
                  className="form-control"
                  value={form.address?.street || ""}
                  onChange={(e) =>
                    handleAddress("street", e.target.value)
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={form.address?.city || ""}
                  onChange={(e) =>
                    handleAddress("city", e.target.value)
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">State</label>
                <input
                  className="form-control"
                  value={form.address?.state || ""}
                  onChange={(e) =>
                    handleAddress("state", e.target.value)
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Pincode</label>
                <input
                  className="form-control"
                  value={form.address?.pincode || ""}
                  onChange={(e) =>
                    handleAddress("pincode", e.target.value)
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Country</label>
                <input
                  className="form-control"
                  value={form.address?.country || ""}
                  onChange={(e) =>
                    handleAddress("country", e.target.value)
                  }
                />
              </div>

              <div className="col-12 mb-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isActive: e.target.checked
                      })
                    }
                  />
                  <label className="form-check-label">
                    Active Warehouse
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button type="submit" className="btn btn-primary me-2">
                Save
              </button>

              <button
                type="button"
                className="btn btn-label-secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}