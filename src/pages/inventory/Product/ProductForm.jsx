import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProduct, updateProduct } from "../../../lib/productApi";
import { getParentCategories } from "../../../lib/parentCategoryAPI";
import api from "../../../lib/api";

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    parentCategoryId: "",
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
    loadParentCategories();
    if (id) loadProduct();
  }, [id]);

  // ✅ FIXED: correct API usage
  const loadParentCategories = async () => {
    try {
      const res = await getParentCategories();
      if (res.data.success) {
        setParentCategories(res.data.data);
      }
    } catch (err) {
      console.error("Parent categories load error", err);
    }
  };

  const loadCategories = async (parentId) => {
    try {
      if (!parentId) {
        setCategories([]);
        return;
      }
      const res = await api.get(`/categories?parentCategoryId=${parentId}`);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Categories load error", err);
    }
  };

  const loadProduct = async () => {
    try {
      const res = await getProduct(id);
      if (!res.data.success) return;

      const p = res.data.data;

      const parentId = p.categoryId?.parentCategoryId || "";

      // load categories under parent
      if (parentId) await loadCategories(parentId);

      setForm({
        ...p,
        isActive: p.isActive ?? true,
        parentCategoryId: parentId,
        categoryId: p.categoryId?._id || "",
        variants:
          p.variants?.map((v) => ({
            ...v,
            attributes: Object.entries(v.attributes || {}).map(([k, val]) => ({
              key: k,
              value: val
            }))
          })) || [{ attributes: [{ key: "", value: "" }], price: "", cost: "" }]
      });
    } catch (err) {
      console.error("Product load error", err);
    }
  };

  // ================= HANDLERS =================
  const handleParentChange = (e) => {
    const parentId = e.target.value;

    setForm((prev) => ({
      ...prev,
      parentCategoryId: parentId,
      categoryId: ""
    }));

    loadCategories(parentId);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    setForm({
      ...form,
      variants: form.variants.filter((_, i) => i !== vIndex)
    });
  };

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
        variants: form.variants.map((v) => ({
          attributes: Object.fromEntries(
            v.attributes.filter((a) => a.key).map((a) => [a.key, a.value])
          ),
          price: Number(v.price),
          cost: Number(v.cost)
        }))
      };

      if (id) await updateProduct(id, payload);
      else await createProduct(payload);

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
        <div className="row g-3">

          {/* SKU */}
          <div className="col-md-4">
            <label className="form-label">SKU</label>
            <input name="sku" value={form.sku} onChange={handleChange} className="form-control" required />
          </div>

          {/* NAME */}
          <div className="col-md-4">
            <label className="form-label">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
          </div>

          {/* BRAND */}
          <div className="col-md-4">
            <label className="form-label">Brand</label>
            <input name="brand" value={form.brand} onChange={handleChange} className="form-control" />
          </div>

          {/* PARENT CATEGORY */}
          <div className="col-md-6">
            <label className="form-label">Parent Category</label>
            <select
              name="parentCategoryId"
              value={form.parentCategoryId}
              onChange={handleParentChange}
              className="form-select"
              required
            >
              <option value="">Select</option>
              {parentCategories.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}
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

          {/* UOM */}
          <div className="col-md-3">
            <label className="form-label">UOM</label>
            <input name="uom" value={form.uom} onChange={handleChange} className="form-control" />
          </div>

          {/* TAX */}
          <div className="col-md-3">
            <label className="form-label">Tax %</label>
            <input type="number" name="taxRate" value={form.taxRate} onChange={handleChange} className="form-control" />
          </div>

          {/* DESC */}
          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-control" />
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
                  <div key={ai} className="d-flex align-items-end gap-2 mb-2 w-100">
                    <div className="flex-grow-1">
                      <input
                        value={attr.key}
                        onChange={(e) =>
                          handleAttributeChange(vi, ai, "key", e.target.value)
                        }
                        className="form-control"
                        placeholder="Property"
                      />
                    </div>

                    <div className="flex-grow-1">
                      <input
                        value={attr.value}
                        onChange={(e) =>
                          handleAttributeChange(vi, ai, "value", e.target.value)
                        }
                        className="form-control"
                        placeholder="Value"
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      style={{ height: "38px" }}
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

        <div className="mt-4 d-flex justify-content-between">
          <div className="form-check">
            <input
              type="checkbox"
              id="is-active"
              className="form-check-input"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="is-active">
              Is Active
            </label>
          </div>

          <button className="btn btn-primary">
            {id ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}