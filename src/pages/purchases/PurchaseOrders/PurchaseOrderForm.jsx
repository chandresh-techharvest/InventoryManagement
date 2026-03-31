import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPurchaseOrder } from "../../../lib/purchaseOrdersAPI";
import { getSuppliers } from "../../../lib/suppliersAPI";
import { getWarehouses } from "../../../lib/warehouseAPI";
import { getProducts } from "../../../lib/productApi";

export default function PurchaseOrderForm() {

  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    supplierId: "",
    warehouseId: "",
    items: [],
    taxRate: 0,
    expectedDeliveryDate: "",
    notes: ""
  });

  const loadData = async () => {
    const sup = await getSuppliers();
    const wh = await getWarehouses();
    const prod = await getProducts();

    setSuppliers(sup.data.data);
    setWarehouses(wh.data.data);
    setProducts(prod.data.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItem = () => {

    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          variantId: "",
          quantity: 1,
          unitPrice: 0
        }
      ]
    }));
  };

  const updateItem = (index, field, value) => {

    setForm(prev => {

      const updatedItems = [...prev.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };

      // Reset variant if product changes
      if (field === "productId") {
        updatedItems[index].variantId = "";
      }

      return {
        ...prev,
        items: updatedItems
      };

    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    try {

      const payload = {
        ...form,
        taxRate: Number(form.taxRate)
      };
      await createPurchaseOrder(payload);

            navigate(-1);
    } catch (err) {
      console.log(err.response.data.error)
    }
  };

  return (
    <div className="container-xxl container-p-y">

      <h4 className="mb-4">Create Purchase Order</h4>

      <form className="card p-4" onSubmit={handleSubmit}>

        {/* SUPPLIER */}

        <div className="mb-3">

          <label className="form-label">Supplier</label>

          <select
            className="form-select"
            value={form.supplierId}
            onChange={(e) =>
              setForm({ ...form, supplierId: e.target.value })
            }
            required
          >

            <option value="">Select Supplier</option>

            {suppliers.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}

          </select>

        </div>

        {/* WAREHOUSE */}

        <div className="mb-3">

          <label className="form-label">Warehouse</label>

          <select
            className="form-select"
            value={form.warehouseId}
            onChange={(e) =>
              setForm({ ...form, warehouseId: e.target.value })
            }
            required
          >

            <option value="">Select Warehouse</option>

            {warehouses.map(w => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}

          </select>

        </div>

        {/* ITEMS */}

        <h5>Items</h5>

        <table className="table">

          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>

          <tbody>

            {form.items.map((item, index) => {

              const product = products.find(
                p => p._id === item.productId
              );

              return (
                <tr key={index}>

                  <td>

                    <select
                      className="form-select"
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                    >

                      <option value="">Select Product</option>

                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}

                    </select>

                  </td>

                  <td>

                    <select
                      className="form-select"
                      value={item.variantId}
                      onChange={(e) => {
  const selectedVariantId = e.target.value;

  const selectedVariant = product?.variants?.find(
    (v) => v._id === selectedVariantId
  );

  updateItem(index, "variantId", selectedVariantId);
  updateItem(
    index,
    "unitPrice",
    selectedVariant ? selectedVariant.cost : 0
  );
}}
                    >

                      <option value="">Variant</option>

                      {product?.variants?.map((v) => (
                        <option key={v._id} value={v._id}>
                          {Object.values(v.attributes).join(", ")}
                        </option>
                      ))}

                    </select>

                  </td>

                  <td>

                    <input
                      type="number"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                    />

                  </td>

                  <td>

                    <input
                      // type="number"
                      className="form-control"
                      value={item.unitPrice}
                      // onChange={(e) =>
                      //   updateItem(index, "unitPrice", Number(e.target.value))
                      // }
                      disabled
                    />

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

        <button
          type="button"
          className="btn btn-outline-primary mb-3"
          onClick={addItem}
        >
          Add Item
        </button>

        {/* TAX */}

        <div className="mb-3">

          <label>Tax Rate (%)</label>

          <input
            type="number"
            className="form-control"
            value={form.taxRate}
            onChange={(e) =>
              setForm({ ...form, taxRate: e.target.value })
            }
          />

        </div>

        {/* DELIVERY */}

        <div className="mb-3">

          <label>Expected Delivery Date</label>

          <input
            type="date"
            className="form-control"
            value={form.expectedDeliveryDate}
            onChange={(e) =>
              setForm({
                ...form,
                expectedDeliveryDate: e.target.value
              })
            }
          />

        </div>

        {/* NOTES */}

        <div className="mb-3">

          <label>Notes</label>

          <textarea
            className="form-control"
            rows="3"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
          />

        </div>

        <button className="btn btn-primary">
          Create Purchase Order
        </button>

      </form>

    </div>
  );
}