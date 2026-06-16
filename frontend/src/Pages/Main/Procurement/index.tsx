import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart, faPlus, faTrash, faCheck, faXmark, faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../../../Components/Modals/ConfirmationModal";
import { toast } from "react-toastify";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Input from "../../../Components/Inputs/Input";
import SelectSecondary from "../../../Components/Inputs/SelectSecondary";
import Search from "../../../Components/Inputs/Search";
import MainTable from "../../../Components/Tables/MainTable";
import TableSettings from "../../../Components/TableSettings";
import { getUserSettings } from "../../../Services/settings";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  PurchaseOrderStatus,
  CreatePurchaseOrderDto,
  PurchaseOrder,
} from "../../../Services/purchaseOrders";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { color: string; bg: string }> = {
  draft:      { color: "#9a9a9a", bg: "#F5F5F5" },
  submitted:  { color: "#2B9AE9", bg: "#EBF5FB" },
  approved:   { color: "#8E44AD", bg: "#F5EEF8" },
  ordered:    { color: "#F1A20F", bg: "#FEF9EC" },
  received:   { color: "#30A712", bg: "#EAFAE5" },
  cancelled:  { color: "#F3606E", bg: "#FEF0F0" },
};

const STATUSES: PurchaseOrderStatus[] = ["draft", "submitted", "approved", "ordered", "received", "cancelled"];

const EMPTY: CreatePurchaseOrderDto = {
  title: "",
  supplier: "",
  status: "draft",
  orderDate: "",
  expectedDelivery: "",
  totalCost: "",
  currency: "USD",
  notes: "",
};

const StatusBadge = ({ status }: { status: PurchaseOrderStatus }) => {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status] ?? { color: "#9a9a9a", bg: "#F5F5F5" };
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {t(`procurement.status.${status}`)}
    </span>
  );
};

const formatDate = (s: string | null) => (s ? s.slice(0, 10) : "—");

const OrderModal = ({
  editing,
  initial,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  editing: boolean;
  initial: CreatePurchaseOrderDto;
  onClose: () => void;
  onSave: (data: CreatePurchaseOrderDto) => void;
  onDelete?: () => void;
  saving: boolean;
  deleting?: boolean;
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (key: keyof CreatePurchaseOrderDto, value: any) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2 font-bold text-[16px]">
            <FontAwesomeIcon icon={faShoppingCart} className="text-[#2B9AE9]" />
            {editing ? t("procurement.edit") : t("procurement.add")}
          </div>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-2">
          <Input
            label={`${t("procurement.field.title")} *`}
            value={draft.title}
            handleChange={(v: string) => set("title", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("procurement.field.supplier")}
              value={draft.supplier}
              handleChange={(v: string) => set("supplier", v)}
            />
            <SelectSecondary
              label={t("procurement.field.status")}
              options={STATUSES.map((s) => ({ value: s, label: t(`procurement.status.${s}`) }))}
              value={{ value: draft.status, label: t(`procurement.status.${draft.status}`) }}
              onSelect={(opt: any) => set("status", opt.value as PurchaseOrderStatus)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("procurement.field.orderDate")}
              type="date"
              value={draft.orderDate}
              handleChange={(v: string) => set("orderDate", v)}
            />
            <Input
              label={t("procurement.field.expectedDelivery")}
              type="date"
              value={draft.expectedDelivery}
              handleChange={(v: string) => set("expectedDelivery", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("procurement.field.totalCost")}
              type="number"
              value={draft.totalCost}
              handleChange={(v: string) => set("totalCost", v)}
            />
            <Input
              label={t("procurement.field.currency")}
              value={draft.currency}
              handleChange={(v: string) => set("currency", v)}
            />
          </div>
          <div>
            <label className="font-bold text-[#3C3C3C]">{t("procurement.field.notes")}</label>
            <textarea
              rows={2}
              className="w-full mt-[6px] rounded-[10px] border border-[#535353] bg-white font-bold px-3 py-2 text-[16px] block resize-none"
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0F0F0]">
          <div>
            {editing && onDelete && (
              <ButtonPrimary
                icon={faTrash}
                text={deleting ? t("common.delete") + "..." : t("common.delete")}
                className="bg-[#F3606E] hover:bg-[#e04e5c]"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting || saving}
              />
            )}
          </div>
          <div className="flex gap-2">
            <ButtonPrimary icon={faXmark} text={t("common.cancel")} color="white" onClick={onClose} />
            <ButtonPrimary
              icon={faCheck}
              text={saving ? t("common.saving") : t("common.save")}
              onClick={() => onSave(draft)}
              disabled={saving || deleting || !draft.title.trim()}
            />
          </div>
        </div>
      </div>
      {confirmOpen && (
        <ConfirmationModal
          isModalOpen={confirmOpen}
          handleOnClose={() => setConfirmOpen(false)}
          onCancel={() => setConfirmOpen(false)}
          onDelete={() => { onDelete?.(); setConfirmOpen(false); }}
        />
      )}
    </div>
  );
};

type StatusMenuState = { id: string; x: number; y: number } | null;

const Procurement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [search, setSearch] = useState("");
  const [statusMenu, setStatusMenu] = useState<StatusMenuState>(null);

  useEffect(() => {
    if (!statusMenu) return;
    const close = () => setStatusMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [statusMenu]);

  const ordersQuery = useQuery({
    queryKey: ["procurement"],
    queryFn: () => getPurchaseOrders(),
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: getUserSettings,
  });

  const createMut = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success(t("procurement.created"));
      setIsFormOpen(false);
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreatePurchaseOrderDto> }) =>
      updatePurchaseOrder(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success(t("procurement.updated"));
      setEditingOrder(null);
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      setStatusMenu(null);
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const deleteMut = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      toast.success(t("procurement.deleted"));
      setEditingOrder(null);
    },
    onError: () => toast.error(t("procurement.error")),
  });

  const allOrders: PurchaseOrder[] = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.total ?? 0;

  const orders = allOrders.filter(
    (o) =>
      !search ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.supplier ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = allOrders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<PurchaseOrderStatus, number>);

  const checkboxes = [
    { name: "title",            label: t("procurement.field.title") },
    { name: "status",           label: t("procurement.field.status") },
    { name: "supplier",         label: t("procurement.field.supplier") },
    { name: "orderDate",        label: t("procurement.field.orderDate") },
    { name: "expectedDelivery", label: t("procurement.field.expectedDelivery") },
    { name: "cost",             label: t("procurement.field.totalCost") },
  ];

  const iconColumn = {
    id: "icon",
    cell: () => <FontAwesomeIcon icon={faShoppingCart} className="text-[#2B9AE9]" />,
    width: "52px",
  };

  const actionsColumn = {
    id: "actions",
    name: "",
    cell: (row: PurchaseOrder) => (
      <button
        className="p-1.5 rounded-[6px] text-[#9a9a9a] hover:text-[#2B9AE9] hover:bg-[#EBF5FB] transition-colors"
        title={t("procurement.changeStatus")}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setStatusMenu((prev) =>
            prev?.id === row.id ? null : { id: row.id, x: rect.left, y: rect.bottom + 4 }
          );
        }}
      >
        <FontAwesomeIcon icon={faChevronDown} className="text-[11px]" />
      </button>
    ),
    width: "52px",
    right: true,
  };

  const allColumns: Record<string, any> = {
    title: {
      id: "title",
      name: t("procurement.field.title"),
      cell: (row: PurchaseOrder) => (
        <div className="min-w-0">
          <div className="font-semibold text-[14px] text-[#3C3C3C] truncate">{row.title}</div>
          {row.notes && <div className="text-[12px] text-[#9a9a9a] truncate">{row.notes}</div>}
        </div>
      ),
      selector: (row: PurchaseOrder) => row.title,
      grow: 2,
    },
    status: {
      id: "status",
      name: t("procurement.field.status"),
      cell: (row: PurchaseOrder) => <StatusBadge status={row.status} />,
      selector: (row: PurchaseOrder) => row.status,
      width: "130px",
    },
    supplier: {
      id: "supplier",
      name: t("procurement.field.supplier"),
      cell: (row: PurchaseOrder) => <span className="text-[13px] text-[#555]">{row.supplier || "—"}</span>,
      selector: (row: PurchaseOrder) => row.supplier ?? "",
      width: "140px",
    },
    orderDate: {
      id: "orderDate",
      name: t("procurement.field.orderDate"),
      cell: (row: PurchaseOrder) => <span className="text-[13px]">{formatDate(row.orderDate)}</span>,
      selector: (row: PurchaseOrder) => row.orderDate ?? "",
      width: "120px",
    },
    expectedDelivery: {
      id: "expectedDelivery",
      name: t("procurement.field.expectedDelivery"),
      cell: (row: PurchaseOrder) => <span className="text-[13px]">{formatDate(row.expectedDelivery)}</span>,
      selector: (row: PurchaseOrder) => row.expectedDelivery ?? "",
      width: "140px",
    },
    cost: {
      id: "cost",
      name: t("procurement.field.totalCost"),
      cell: (row: PurchaseOrder) =>
        row.totalCost ? (
          <span className="text-[13px] font-medium">
            {Number(row.totalCost).toLocaleString()} {row.currency ?? ""}
          </span>
        ) : (
          <span className="text-[#9a9a9a] text-[13px]">—</span>
        ),
      selector: (row: PurchaseOrder) => Number(row.totalCost ?? 0),
      width: "130px",
    },
  };

  const filterColumns = () => {
    const order = userSettings.data?.procurementTableColumnOrder;
    if (!order || order.length === 0) return [iconColumn, ...Object.values(allColumns), actionsColumn];
    const filtered = order.map((id) => allColumns[id]).filter(Boolean);
    return [iconColumn, ...filtered, actionsColumn];
  };

  return (
    <PageMotion>
      <div className="h-[calc(100vh-58px)] w-full px-4">
        {/* Status counters */}
        <div className="flex gap-5 pt-4 pb-2 flex-wrap">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className="text-[18px] font-bold" style={{ color: cfg.color }}>{counts[s]}</span>
                <span className="text-[12px] text-[#9a9a9a]">{t(`procurement.status.${s}`)}</span>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 py-2">
          <Search
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-auto flex-1 min-w-[180px] max-w-[400px]"
          />
          <div className="flex items-center gap-2 ml-auto">
            <TableSettings
              settings={userSettings.data}
              checkboxes={checkboxes}
              settingsKey="procurementTableColumnOrder"
            />
            <ButtonPrimary
              color="white"
              icon={faPlus}
              text={t("procurement.add")}
              onClick={() => setIsFormOpen(true)}
              className="h-[34px]"
            />
          </div>
        </div>

        <MainTable
          columns={filterColumns()}
          data={orders}
          progressPending={ordersQuery.isFetching}
          onRowClicked={(row: PurchaseOrder) => setEditingOrder(row)}
        />
      </div>

      {/* Status dropdown portal */}
      {statusMenu &&
        createPortal(
          <div
            className="fixed z-[9999] bg-white border border-[#E0E0E0] rounded-[8px] shadow-xl min-w-[160px] py-1"
            style={{ left: statusMenu.x, top: statusMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => statusMut.mutate({ id: statusMenu.id, status: s })}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F5F5F5] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_CONFIG[s].color }} />
                {t(`procurement.status.${s}`)}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {isFormOpen && (
        <OrderModal
          editing={false}
          initial={{ ...EMPTY }}
          onClose={() => setIsFormOpen(false)}
          onSave={(data) => createMut.mutate(data)}
          saving={createMut.isPending}
        />
      )}
      {editingOrder && (
        <OrderModal
          editing={true}
          initial={{
            title: editingOrder.title,
            supplier: editingOrder.supplier ?? "",
            status: editingOrder.status,
            orderDate: editingOrder.orderDate ? editingOrder.orderDate.slice(0, 10) : "",
            expectedDelivery: editingOrder.expectedDelivery ? editingOrder.expectedDelivery.slice(0, 10) : "",
            totalCost: editingOrder.totalCost ?? "",
            currency: editingOrder.currency ?? "USD",
            notes: editingOrder.notes ?? "",
          }}
          onClose={() => setEditingOrder(null)}
          onSave={(data) => updateMut.mutate({ id: editingOrder.id, dto: data })}
          onDelete={() => deleteMut.mutate(editingOrder.id)}
          saving={updateMut.isPending}
          deleting={deleteMut.isPending}
        />
      )}
    </PageMotion>
  );
};

export default Procurement;
