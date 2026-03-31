import api from './api'

const BASE = "/purchase-orders";

export const getPurchaseOrders = () => api.get(BASE);

export const getPurchaseOrder = (id) => api.get(`${BASE}/${id}`);

export const createPurchaseOrder = (data) =>
  api.post(BASE, data);

export const updatePOStatus = (id, status) =>
  api.put(`${BASE}/${id}/status`, { status });