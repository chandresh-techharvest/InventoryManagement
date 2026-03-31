import api from "./api";

const BASE = "/warehouses";

// Create Warehouse
export const createWarehouse = (data) => api.post(BASE, data);

// Get All Warehouses
export const getWarehouses = () => api.get(BASE);

// Get Active Warehouses Only
export const getActiveWarehouses = () => api.get(`${BASE}/active`);

// Search Warehouses?q=searchText
export const searchWarehouses = (query) => api.get(`${BASE}/search`, { params: { q: query }});

// Get Single Warehouse
export const getWarehouse = (id) => api.get(`${BASE}/${id}`);

// Update Warehouse
export const updateWarehouse = (id, data) => api.put(`${BASE}/${id}`, data);

// Delete Warehouse
export const deleteWarehouse = (id) => api.delete(`${BASE}/${id}`);