import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createWarehouse,
  getWarehouse,
  updateWarehouse
} from "../../../lib/WarehouseAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";

export default function WarehouseForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const emptyForm = {
    name: "",
    code: "",
    parentCategoryId: "",
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
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
    if (id) loadWarehouse();
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data } = await getParentCategories();
      setCategories(data.data || []);
    } catch (err) {
      console.error("Category load error:", err);
    }
  };

  const loadWarehouse = async () => {
    try {
      const { data } = await getWarehouse(id);
      const w = data.data;

      setForm({
        ...emptyForm,
        ...w,
        parentCategoryId: w.parentCategoryId?._id || "",
        address: {
          ...emptyForm.address,
          ...w.address
        }
      });
    } catch (err) {
      console.error("Warehouse load error:", err);
    }
  };

  const handleAddress = (field, value) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = { ...form };

      // 🚨 send only valid ObjectId
      if (!payload.parentCategoryId) {
        delete payload.parentCategoryId;
      }

      if (id) {
        await updateWarehouse(id, payload);
      } else {
        await createWarehouse(payload);
      }

      navigate(-1);
    } catch (err) {
      console.error("Backend error:", err);

      // ✅ exact backend message
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Something went wrong";

      setError(message);
    }
  };

  return (
    <div className="container-xxl container-p-y">
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">
            {id ? "Edit Warehouse" : "Add Warehouse"}
          </h5>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              <div className="col-md-6">
                <label className="form-label">Warehouse Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Code</label>
                <input
                  className="form-control"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  Warehouse Category
                </label>
                <select
                  className="form-select"
                  value={form.parentCategoryId}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      parentCategoryId: e.target.value
                    }))
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Contact Person
                </label>
                <input
                  className="form-control"
                  value={form.contactPerson || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      contactPerson: e.target.value
                    }))
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Contact Phone
                </label>
                <input
                  className="form-control"
                  value={form.contactPhone || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      contactPhone: e.target.value
                    }))
                  }
                />
              </div>

              <div className="col-12">
                <label className="form-label">Street</label>
                <input
                  className="form-control"
                  value={form.address.street}
                  onChange={(e) =>
                    handleAddress("street", e.target.value)
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={form.address.city}
                  onChange={(e) =>
                    handleAddress("city", e.target.value)
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">State</label>
                <input
                  className="form-control"
                  value={form.address.state}
                  onChange={(e) =>
                    handleAddress("state", e.target.value)
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Pincode</label>
                <input
                  className="form-control"
                  value={form.address.pincode}
                  onChange={(e) =>
                    handleAddress("pincode", e.target.value)
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Country</label>
                <input
                  className="form-control"
                  value={form.address.country}
                  onChange={(e) =>
                    handleAddress("country", e.target.value)
                  }
                />
              </div>

              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isActive: e.target.checked
                      }))
                    }
                  />
                  <label className="form-check-label">
                    Active Warehouse
                  </label>
                </div>
              </div>

              <div className="col-12 mt-3">
                <button className="btn btn-primary me-2">
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

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}