import api from "./api";

const BASE = "/suppliers";

export const getSuppliers = (params) => api.get(BASE, { params });
export const getSupplier = (id) => api.get(`${BASE}/${id}`);
export const createSupplier = (data) => api.post(BASE, data);
export const updateSupplier = (id, data) => api.put(`${BASE}/${id}`, data);
export const deleteSupplier = (id) => api.delete(`${BASE}/${id}`);