/** Canonical event names for the app-wide EventEmitter2 bus. */
export const EVENTS = {
  DEVICE_LIFECYCLE_CHANGED: 'device.lifecycle.changed',
  DEVICE_SCAN_COMPLETED: 'device.scan.completed',
  TICKET_STATE_CHANGED: 'ticket.state.changed',
  PURCHASE_ORDER_RECEIVED: 'purchase_order.received',
  LICENSE_EXPIRING: 'license.expiring',
  LICENSE_EXPIRED: 'license.expired',
  CVE_CRITICAL_DETECTED: 'cve.critical_detected',
} as const;
