import api from "../lib/api";

export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "ordered"
  | "received"
  | "cancelled";

export type PurchaseOrder = {
  id: string;
  title: string;
  supplier: string | null;
  requesterId: string | null;
  requester?: { id: string; name: string; surname: string; email: string } | null;
  status: PurchaseOrderStatus;
  orderDate: string | null;
  expectedDelivery: string | null;
  receivedAt: string | null;
  totalCost: number | null;
  currency: string | null;
  notes: string | null;
  createdAt: string;
};

export type CreatePurchaseOrderDto = {
  title: string;
  supplier?: string;
  status?: PurchaseOrderStatus;
  orderDate?: string;
  expectedDelivery?: string;
  receivedAt?: string;
  totalCost?: number | string;
  currency?: string;
  notes?: string;
};

export const getPurchaseOrders = async (
  query = ""
): Promise<{ data: PurchaseOrder[]; total: number }> => {
  const { data } = await api.get(`/procurement${query ? `?${query}` : ""}`);
  return data;
};

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  const { data } = await api.get(`/procurement/${id}`);
  return data;
};

export const createPurchaseOrder = async (
  dto: CreatePurchaseOrderDto
): Promise<PurchaseOrder> => {
  const { data } = await api.post("/procurement", dto);
  return data;
};

export const updatePurchaseOrder = async (
  id: string,
  dto: Partial<CreatePurchaseOrderDto>
): Promise<PurchaseOrder> => {
  const { data } = await api.patch(`/procurement/${id}`, dto);
  return data;
};

export const updatePurchaseOrderStatus = async (
  id: string,
  status: PurchaseOrderStatus
): Promise<PurchaseOrder> => {
  const { data } = await api.patch(`/procurement/${id}/status`, { status });
  return data;
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  await api.delete(`/procurement/${id}`);
};
