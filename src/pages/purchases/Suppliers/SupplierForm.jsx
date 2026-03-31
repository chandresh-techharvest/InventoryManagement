import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "../../../lib/suppliersAPI";
import locations from "../../../pages/data/locations.json";

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    code: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    paymentTerms: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  const states = locations.states.map((s) => s.name);
  const [cities, setCities] = useState([]);
  const [pincodes, setPincodes] = useState([]);

  useEffect(() => {
    if (form.state) {
      const stateData = locations.states.find((s) => s.name === form.state);
      setCities(stateData?.cities || []);
    }

    if (form.city) {
      const cityData = cities.find((c) => c.name === form.city);
      setPincodes(cityData?.pincodes || []);
    }
  }, [form.state, form.city, cities]);

  // LOAD SUPPLIER
  useEffect(() => {
    if (id) loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      const res = await getSupplier(id);

      if (!res.data.success) return;

      const sup = res.data.data;

      setForm({
        code: sup.code || "",
        name: sup.name || "",
        contactPerson: sup.contactPerson || "",
        email: sup.email || "",
        phone: sup.phone || "",
        gstNumber: sup.gstNumber || "",
        paymentTerms: sup.paymentTerms || "",
        street: sup.address?.street || "",
        city: sup.address?.city || "",
        state: sup.address?.state || "",
        pincode: sup.address?.pincode || "",
        country: sup.address?.country || "",
      });
    } catch (err) {
      console.error("Supplier load error", err);
    }
  };

  // ================= AUTO SUPPLIER CODE =================
  const generateSupplierCode = async () => {
    try {
      const res = await getSuppliers();

      if (!res.data.success) return;

      const tenantSuppliers = res.data.data;

      if (tenantSuppliers.length === 0) {
        setForm((prev) => ({ ...prev, code: "SUP-001" }));
        return;
      }

      // extract numeric part
      const maxNumber = Math.max(
        ...tenantSuppliers.map((s) =>
          parseInt((s.code || "SUP-00").split("-")[1]),
        ),
      );

      const nextNumber = maxNumber + 1;

      const newCode = `SUP-${String(nextNumber).padStart(3, "0")}`;

      setForm((prev) => ({
        ...prev,
        code: newCode,
      }));
    } catch (err) {
      console.error("Code generation error", err);
    }
  };

  useEffect(() => {
    if (!id) generateSupplierCode();
  }, [id]);

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      setForm((prev) => ({
        ...prev,
        state: value,
        city: "",
        pincode: "",
      }));
    } else if (name === "city") {
      const cityData = cities.find((c) => c.name === value);

      setForm((prev) => ({
        ...prev,
        city: value,
        pincode: cityData?.pincodes?.[0] || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        code: form.code,
        name: form.name,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        gstNumber: form.gstNumber,
        paymentTerms: form.paymentTerms,

        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
        },
      };

      if (id) {
        await updateSupplier(id, payload);
      } else {
        await createSupplier(payload);
      }

      navigate(-1);
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.error || "Error saving supplier");
    }
  };

  return (
    <div className="container-xxl my-4">
      <h4 className="mb-4">{id ? "Edit Supplier" : "Add Supplier"}</h4>

      <form onSubmit={handleSubmit} className="card p-4">
        <div className="row g-3">
          <div className="col-md-12">
            <label className="form-label">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Code</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              className="form-control"
              disabled
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">GST Number</label>
            <input
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-12">
            <label className="form-label">Contact Person</label>
            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">State</label>
            <select
              name="state"
              value={form.state || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select State</option>

              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">City</label>
            <select
              name="city"
              value={form.city || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select City</option>

              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Pincode</label>
            <select
              name="pincode"
              value={form.pincode || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select Pincode</option>

              {pincodes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Street</label>
            <input
              name="street"
              value={form.street}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-8">
            <label className="form-label">Payment Terms</label>
            <select
              name="paymentTerms"
              value={form.paymentTerms}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select</option>
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

          <div className="col-12">
            <button className="btn btn-primary">
              {id ? "Update Supplier" : "Create Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
