// Tiny bridge so the API client can tell the maintenance gate "the server just
// refused a request because the system is locked" without importing UI code.
export const MAINTENANCE_EVENT = "tms:maintenance";
export const notifyMaintenance = () => window.dispatchEvent(new Event(MAINTENANCE_EVENT));
