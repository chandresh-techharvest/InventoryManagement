import api from "./api";

/*
 * ════════════════════════════════════════════════════════
 *  INVENTORY API  —  matches every route in inventoryController.js
 *  + the Postman collection (5.1 → 5.NEW + adjustStock + transferStock)
 * ════════════════════════════════════════════════════════
 */

// ─── POST /inventory ──────────────────────────────────────────────────────────
// Postman 5.1 / 5.2 / 5.3 — upserts (adds to existing quantity if record exists)
// Body: { warehouseId, productId, variantId, quantity,
//         reorderLevel?, safetyStock?, batchNumber?, expiryDate? }
export const addStock = (data) => api.post("/inventory", data);

// ─── GET /inventory ───────────────────────────────────────────────────────────
// Postman 5.4 — all inventory
// Postman 5.5 — filter by warehouse  → getInventory({ warehouseId })
// Postman 5.6 — filter by product    → getInventory({ productId })
// Postman 5.9 — low stock only       → getInventory({ lowStock: true })
export const getInventory = (params = {}) =>
  api.get("/inventory", { params });

// ─── GET /inventory/low-stock ─────────────────────────────────────────────────
// Postman 5.9 (dedicated route, more accurate than lowStock query param)
export const getLowStock = () => api.get("/inventory/low-stock");

// ─── GET /inventory/total/:productId ─────────────────────────────────────────
// Postman 5.7 — aggregated stock across all warehouses for one product
// Returns: { totalQuantity, totalAvailable, totalReserved, breakdown[] }
export const getTotalStock = (productId) =>
  api.get(`/inventory/total/${productId}`);

// ─── GET /inventory/movements ────────────────────────────────────────────────
// Postman 5.NEW — last 100 movements, sorted by date desc
// Params: productId?, warehouseId?, movementType? (IN|OUT|TRANSFER|ADJUSTMENT)
export const getStockMovements = (params = {}) => {
  // strip empty strings so backend doesn't receive empty query params
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v != null)
  );
  return api.get("/inventory/movements", { params: clean });
};

// ─── POST /inventory/transfer ────────────────────────────────────────────────
// User-added to controller — double-entry transfer between warehouses
// Body: { productId, variantId, fromWarehouse, toWarehouse, quantity }
export const transferStock = (data) => api.post("/inventory/transfer", data);

// ─── POST /inventory/adjust ──────────────────────────────────────────────────
// User-added to controller — manual IN or OUT adjustment with reason
// Body: { inventoryId, adjustmentType: "IN"|"OUT", quantity, reason? }
export const adjustStock = (data) => api.post("/inventory/adjust", data);

// ─── GET  /inventory/:id ─────────────────────────────────────────────────────
// Postman 5.10 — single record (populated warehouse + product)
export const getInventoryById = (id) => api.get(`/inventory/${id}`);

// ─── PUT  /inventory/:id ─────────────────────────────────────────────────────
// Postman 5.8 — update reorderLevel / safetyStock / quantityOnHand
export const updateStock = (id, data) => api.put(`/inventory/${id}`, data);
// Auto-creates ADJUSTMENT movement if quantityOnHand changes