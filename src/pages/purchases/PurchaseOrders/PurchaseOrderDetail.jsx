import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPurchaseOrder, updatePOStatus } from "../../../lib/purchaseOrdersAPI";

const STATUS_COLORS = {
    draft:              { bg: "bg-label-secondary", text: "Draft" },
    confirmed:          { bg: "bg-label-primary",   text: "Confirmed" },
    partially_received: { bg: "bg-label-warning",   text: "Partially Received" },
    completed:          { bg: "bg-label-success",   text: "Completed" },
    cancelled:          { bg: "bg-label-danger",    text: "Cancelled" },
};

const NEXT_STATUSES = {
    draft:              ["confirmed", "cancelled"],
    confirmed:          ["partially_received", "completed", "cancelled"],
    partially_received: ["completed", "cancelled"],
    completed:          [],
    cancelled:          [],
};

const STATUS_DESCRIPTIONS = {
    confirmed:          "Confirm this purchase order",
    partially_received: "Mark as partially received",
    completed:          "Mark as completed",
    cancelled:          "Cancel this purchase order",
};

function formatCurrency(amount) {
    if (amount == null) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

// { Color: 'Red', Storage: '128GB' }  →  "Color: Red, Storage: 128GB"
function formatAttributes(attributes) {
    if (!attributes) return "—";
    const entries = Object.entries(attributes);
    if (entries.length === 0) return "—";
    return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

export default function PurchaseOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [updating, setUpdating] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const loadPO = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getPurchaseOrder(id);
            if (res.data.success) {
                setPo(res.data.data);
            } else {
                setError("Failed to load purchase order.");
            }
        } catch {
            setError("An error occurred while fetching the order.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPO(); }, [id]);
    useEffect(() => { if (showStatusModal) setSelectedStatus(""); }, [showStatusModal]);

    const handleStatusUpdate = async () => {
        if (!selectedStatus) return;
        setUpdating(true);
        try {
            const res = await updatePOStatus(id, selectedStatus);
            if (res.data.success) {
                setPo((prev) => ({ ...prev, status: selectedStatus }));
                setStatusMsg({
                    type: "success",
                    text: `Status updated to "${STATUS_COLORS[selectedStatus]?.text}" successfully.`,
                });
                setShowStatusModal(false);
            } else {
                setStatusMsg({ type: "danger", text: "Failed to update status." });
            }
        } catch {
            setStatusMsg({ type: "danger", text: "An error occurred while updating status." });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="container-xxl container-p-y d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" />
                    <p className="text-muted">Loading purchase order...</p>
                </div>
            </div>
        );
    }

    if (error || !po) {
        return (
            <div className="container-xxl container-p-y">
                <div className="alert alert-danger">{error || "Order not found."}</div>
                <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button>
            </div>
        );
    }

    const statusInfo      = STATUS_COLORS[po.status] || { bg: "bg-label-secondary", text: po.status };
    const canUpdateStatus = NEXT_STATUSES[po.status]?.length > 0;
    const modalOptions    = NEXT_STATUSES[po.status] || [];

    return (
        <div className="container-xxl container-p-y">

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0">{po.poNumber}</h4>
                    <small className="text-muted">Purchase Order Detail</small>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className={`badge ${statusInfo.bg} fs-6 px-3 py-2`}>{statusInfo.text}</span>
                    {canUpdateStatus && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowStatusModal(true)}>
                            <i className="bx bx-transfer me-1"></i> Update Status
                        </button>
                    )}
                </div>
            </div>

            {/* STATUS ALERT */}
            {statusMsg && (
                <div className={`alert alert-${statusMsg.type} alert-dismissible mb-3`} role="alert">
                    {statusMsg.text}
                    <button type="button" className="btn-close" onClick={() => setStatusMsg(null)} />
                </div>
            )}

            {/* RECEIPT CARD */}
            <div className="card mb-4">
                <div className="card-body p-4">

                    {/* Receipt Header */}
                    <div className="row mb-4">
                        <div className="col-sm-6 mb-3 mb-sm-0">
                            <h5 className="fw-bold mb-1">Purchase Order Receipt</h5>
                            <p className="text-muted mb-0">{po.poNumber}</p>
                        </div>
                        <div className="col-sm-6 text-sm-end">
                            <p className="mb-1">
                                <span className="text-muted">Order Date: </span>
                                <strong>{new Date(po.orderDate).toDateString()}</strong>
                            </p>
                            <p className="mb-0">
                                <span className="text-muted">Expected Delivery: </span>
                                <strong>{new Date(po.expectedDeliveryDate).toDateString()}</strong>
                            </p>
                        </div>
                    </div>

                    <hr className="my-3" />

                    {/* Supplier & Warehouse */}
                    <div className="row mb-4">
                        <div className="col-md-6 mb-3 mb-md-0">
                            <p className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                                Supplier
                            </p>
                            <p className="fw-bold mb-0">{po.supplierId?.name || "—"}</p>
                            {po.supplierId?.code && (
                                <p className="text-muted mb-0">
                                    <i className="bx bx-barcode me-1"></i>{po.supplierId.code}
                                </p>
                            )}
                            {po.supplierId?.contactPerson && (
                                <p className="text-muted mb-0 small">
                                    <i className="bx bx-user me-1"></i>{po.supplierId.contactPerson}
                                </p>
                            )}
                            {po.supplierId?.phone && (
                                <p className="text-muted mb-0 small">
                                    <i className="bx bx-phone me-1"></i>{po.supplierId.phone}
                                </p>
                            )}
                        </div>

                        <div className="col-md-6">
                            <p className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                                Deliver To
                            </p>
                            <p className="fw-bold mb-0">{po.warehouseId?.name || "—"}</p>
                            {po.warehouseId?.code && (
                                <p className="text-muted mb-0">
                                    <i className="bx bx-building me-1"></i>{po.warehouseId.code}
                                </p>
                            )}
                            {po.warehouseId?.address && (
                                <p className="text-muted mb-0 small">
                                    <i className="bx bx-map me-1"></i>
                                    {[
                                        po.warehouseId.address.street,
                                        po.warehouseId.address.city,
                                        po.warehouseId.address.state,
                                        po.warehouseId.address.pincode,
                                        po.warehouseId.address.country,
                                    ].filter(Boolean).join(", ")}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr className="my-3" />

                    {/* Items Table */}
                    <p className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                        Order Items
                    </p>

                    <div className="table-responsive mb-3">
                        <table className="table table-bordered align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th className="text-end">Unit Price</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-end">Tax</th>
                                    <th className="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {po.items?.map((item, idx) => (
                                    <tr key={item._id}>
                                        <td className="text-muted">{idx + 1}</td>

                                        {/* Product: name + SKU · UOM */}
                                        <td>
                                            <div className="fw-semibold">{item.productId?.name || "—"}</div>
                                            <small className="text-muted">
                                                {item.productId?.sku || ""}
                                                {item.productId?.uom ? ` · ${item.productId.uom}` : ""}
                                            </small>
                                        </td>

                                        {/* Variant: attributes */}
                                        <td>
                                            <div className="fw-semibold">
                                                {formatAttributes(item.variant?.attributes)}
                                            </div>
                                        </td>

                                        <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-end">{item.tax != null ? `${item.tax}%` : "—"}</td>
                                        <td className="text-end fw-semibold">{formatCurrency(item.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="row justify-content-end">
                        <div className="col-md-4">
                            <table className="table table-sm mb-0">
                                <tbody>
                                    <tr>
                                        <td className="text-muted">Subtotal</td>
                                        <td className="text-end">{formatCurrency(po.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Tax ({po.taxRate ?? 0}%)</td>
                                        <td className="text-end">{formatCurrency(po.taxAmount)}</td>
                                    </tr>
                                    <tr className="border-top">
                                        <td className="fw-bold">Total Amount</td>
                                        <td className="text-end fw-bold fs-5 text-primary">
                                            {formatCurrency(po.totalAmount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {po.notes && (
                        <>
                            <hr className="my-3" />
                            <div>
                                <p className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                                    Notes
                                </p>
                                <p className="mb-0">{po.notes}</p>
                            </div>
                        </>
                    )}

                </div>

                {/* Card Footer */}
                <div className="card-footer text-muted d-flex flex-wrap gap-3" style={{ fontSize: "0.8rem" }}>
                    <span>
                        <i className="bx bx-calendar me-1"></i>
                        Created: {new Date(po.createdAt).toDateString()}
                    </span>
                </div>
            </div>

            {/* STATUS MODAL */}
            {showStatusModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowStatusModal(false)} />
                    <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5 className="modal-title">Update Order Status</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)} disabled={updating} />
                                </div>

                                <div className="modal-body">
                                    <p className="text-muted mb-3">
                                        Current status:{" "}
                                        <span className={`badge ${statusInfo.bg}`}>{statusInfo.text}</span>
                                    </p>

                                    {modalOptions.length === 0 ? (
                                        <div className="alert alert-info mb-0">
                                            No further status transitions available for this order.
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {modalOptions.map((s) => (
                                                <label
                                                    key={s}
                                                    className={`d-flex align-items-center gap-3 p-3 rounded border ${
                                                        selectedStatus === s ? "border-primary bg-label-primary" : "border-light"
                                                    }`}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="newStatus"
                                                        value={s}
                                                        checked={selectedStatus === s}
                                                        onChange={() => setSelectedStatus(s)}
                                                        className="form-check-input mt-0"
                                                    />
                                                    <div>
                                                        <span className={`badge ${STATUS_COLORS[s]?.bg} me-2`}>
                                                            {STATUS_COLORS[s]?.text}
                                                        </span>
                                                        <small className="text-muted">{STATUS_DESCRIPTIONS[s]}</small>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button className="btn btn-outline-secondary" onClick={() => setShowStatusModal(false)} disabled={updating}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" disabled={!selectedStatus || updating} onClick={handleStatusUpdate}>
                                        {updating ? (
                                            <><span className="spinner-border spinner-border-sm me-2" />Updating...</>
                                        ) : "Update Status"}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}