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
    variants: [
      { attributes: { color: "", size: "" }, price: "", cost: "" }
    ]
  });

  // ---------- LOAD ----------
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

        setForm({
        ...p,
        categoryId: p.categoryId?._id || "",
        });
    }
  };

  // ---------- HANDLERS ----------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...form.variants];
    if (field === "color" || field === "size") {
      updated[index].attributes[field] = value;
    } else {
      updated[index][field] = value;
    }
    setForm({ ...form, variants: updated });
  };

  const addVariant = () => {
    setForm({
      ...form,
      variants: [
        ...form.variants,
        { attributes: { color: "", size: "" }, price: "", cost: "" }
      ]
    });
  };

  const removeVariant = (index) => {
    const updated = form.variants.filter((_, i) => i !== index);
    setForm({ ...form, variants: updated });
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const payload = {
        ...form,
        taxRate: Number(form.taxRate),
        variants: form.variants.map(v => ({
            attributes: {
            color: v.attributes.color,
            size: v.attributes.size
            },
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
        <h5>Variants</h5>

        {form.variants.map((v, i) => (
          <div key={i} className="row g-2 align-items-end mb-2">
            <div className="col-md-3">
              <label className="form-label">Color</label>
              <input
                value={v.attributes.color}
                onChange={(e) =>
                  handleVariantChange(i, "color", e.target.value)
                }
                className="form-control"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Size</label>
              <input
                value={v.attributes.size}
                onChange={(e) =>
                  handleVariantChange(i, "size", e.target.value)
                }
                className="form-control"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                value={v.price}
                onChange={(e) =>
                  handleVariantChange(i, "price", e.target.value)
                }
                className="form-control"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Cost</label>
              <input
                type="number"
                value={v.cost}
                onChange={(e) =>
                  handleVariantChange(i, "cost", e.target.value)
                }
                className="form-control"
              />
            </div>

            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeVariant(i)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-outline-primary mt-2"
          onClick={addVariant}
        >
          + Add Variant
        </button>

        {/* SUBMIT */}
        <div className="mt-4">
          <button className="btn btn-primary">
            {id ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
