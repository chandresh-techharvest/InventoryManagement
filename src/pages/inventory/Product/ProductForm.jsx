import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProduct, updateProduct } from "../../../lib/productApi";
import api from "../../../lib/api";

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    brand: "",
    uom: "PCS",
    taxRate: 0,
    isActive: true,
    variants: [
      {
        attributes: [{ key: "", value: "" }],
        price: "",
        cost: ""
      }
    ]
  });

  // ================= LOAD =================
  useEffect(() => {
    loadCategories();
    if (id) loadProduct();
  }, [id]);

  const loadCategories = async () => {
    const res = await api.get("/categories");
    if (res.data.success) setCategories(res.data.data);
  };

  const loadProduct = async () => {
    const res = await getProduct(id);
    if (res.data.success) {
      const p = res.data.data;

      // convert backend attributes object -> array
      const variants = p.variants?.map(v => ({
        ...v,
        attributes: Object.entries(v.attributes || {}).map(([k, val]) => ({
          key: k,
          value: val
        }))
      }));

      setForm({
        ...p,
        isActive: p.isActive ?? true,
        categoryId: p.categoryId?._id || "",
        variants: variants?.length
          ? variants
          : [{ attributes: [{ key: "", value: "" }], price: "", cost: "" }]
      });
    }
  };

  // ================= BASIC HANDLERS =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= VARIANT HANDLERS =================
  const handleVariantChange = (vIndex, field, value) => {
    const updated = [...form.variants];
    updated[vIndex][field] = value;
    setForm({ ...form, variants: updated });
  };

  const addVariant = () => {
    setForm({
      ...form,
      variants: [
        ...form.variants,
        { attributes: [{ key: "", value: "" }], price: "", cost: "" }
      ]
    });
  };

  const removeVariant = (vIndex) => {
    const updated = form.variants.filter((_, i) => i !== vIndex);
    setForm({ ...form, variants: updated });
  };

  // ================= ATTRIBUTE HANDLERS =================
  const handleAttributeChange = (vIndex, aIndex, field, value) => {
    const updated = [...form.variants];
    updated[vIndex].attributes[aIndex][field] = value;
    setForm({ ...form, variants: updated });
  };

  const addAttribute = (vIndex) => {
    const updated = [...form.variants];
    updated[vIndex].attributes.push({ key: "", value: "" });
    setForm({ ...form, variants: updated });
  };

  const removeAttribute = (vIndex, aIndex) => {
    const updated = [...form.variants];
    updated[vIndex].attributes.splice(aIndex, 1);
    setForm({ ...form, variants: updated });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        taxRate: Number(form.taxRate),
        variants: form.variants.map(v => ({
          attributes: Object.fromEntries(
            v.attributes
              .filter(a => a.key)
              .map(a => [a.key, a.value])
          ),
          price: Number(v.price),
          cost: Number(v.cost)
        }))
      };

      if (id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }

      navigate(-1);
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.error || "Error saving product");
    }
  };

  // ================= UI =================
  return (
    <div className="container-xxl my-4">
      <h4 className="mb-4">{id ? "Edit Product" : "Add Product"}</h4>

      <form onSubmit={handleSubmit} className="card p-4">

        {/* BASIC INFO */}
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Brand</label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Category</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">UOM</label>
            <input
              name="uom"
              value={form.uom}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Tax %</label>
            <input
              type="number"
              name="taxRate"
              value={form.taxRate}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        {/* VARIANTS */}
        <hr className="my-4" />
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Variants</h5>
        </div>

        {form.variants.map((v, vi) => (
          <div key={vi} className="card border mb-3 shadow-sm">
            <div className="card-body">

              {/* HEADER */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-semibold">Variant {vi + 1}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeVariant(vi)}
                >
                  Remove
                </button>
              </div>

              {/* ATTRIBUTES */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Attributes</label>

                {v.attributes.map((attr, ai) => (
                  <div className="d-flex align-items-end gap-2 mb-2 w-100">
                    {/* PROPERTY */}
                    <div className="flex-grow-1">
                      <input
                        value={attr.key}
                        onChange={(e) =>
                          handleAttributeChange(vi, ai, "key", e.target.value)
                        }
                        className="form-control"
                        placeholder="Property (e.g. Color)"
                      />
                    </div>

                    {/* VALUE */}
                    <div className="flex-grow-1">
                      <input
                        value={attr.value}
                        onChange={(e) =>
                          handleAttributeChange(vi, ai, "value", e.target.value)
                        }
                        className="form-control"
                        placeholder="Value (e.g. Red)"
                      />
                    </div>

                    {/* REMOVE BUTTON — RIGHT EDGE */}
                    <button
                      type="button"
                      className="btn btn-outline-danger ms-auto"
                      style={{ height: "38px", minWidth: "42px" }}
                      onClick={() => removeAttribute(vi, ai)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-1"
                  onClick={() => addAttribute(vi)}
                >
                  + Add Attribute
                </button>
              </div>

              {/* PRICE + COST */}
              <div className="row g-3">
                <div className="col-6 col-md-4">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) =>
                      handleVariantChange(vi, "price", e.target.value)
                    }
                    className="form-control"
                  />
                </div>

                <div className="col-6 col-md-4">
                  <label className="form-label">Cost</label>
                  <input
                    type="number"
                    value={v.cost}
                    onChange={(e) =>
                      handleVariantChange(vi, "cost", e.target.value)
                    }
                    className="form-control"
                  />
                </div>
              </div>

            </div>
          </div>
        ))}


        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={addVariant}
        >
          + Add Variant
        </button>

        {/* SUBMIT */}
        <div className="mt-4 d-flex justify-content-between align-items-center">
          <div className="form-check">
            <input
              type="checkbox"
              id="is-active"
              className="form-check-input"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            <label className="form-check-label" htmlFor="is-active">
              Is Active
            </label>
          </div>

          <div>
            <button className="btn btn-primary">
              {id ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
