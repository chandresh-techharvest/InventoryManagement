import api from "./api";

const BASE = "/warehouses";

/**
 * 4.1 Create Warehouse
 */
export const createWarehouse = (data) =>
  api.post(BASE, data);

/**
 * 4.3 Get All Warehouses
 */
export const getWarehouses = () =>
  api.get(BASE);

/**
 * 4.4 Get Active Warehouses Only
 */
export const getActiveWarehouses = () =>
  api.get(`${BASE}/active`);

/**
 * 4.5 Search Warehouses
 * ?q=searchText
 */
export const searchWarehouses = (query) =>
  api.get(`${BASE}/search`, {
    params: { q: query }
  });

/**
 * 4.6 Get Single Warehouse
 */
export const getWarehouse = (id) =>
  api.get(`${BASE}/${id}`);

/**
 * 4.7 Update Warehouse
 */
export const updateWarehouse = (id, data) =>
  api.put(`${BASE}/${id}`, data);

/**
 * 4.8 Delete Warehouse
 */
export const deleteWarehouse = (id) =>
  api.delete(`${BASE}/${id}`);