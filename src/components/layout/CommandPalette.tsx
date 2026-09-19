import { useEffect } from "react";
import { Command } from "cmdk";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Search, CornerDownLeft } from "lucide-react";
import { NAV_ITEMS } from "./nav-config";
import { useAuth } from "../../lib/auth-context";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { hasPermission, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.permission || hasPermission(...item.permission));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-chrome-border bg-chrome shadow-popover"
          >
            <Command loop shouldFilter>
              <div className="flex items-center gap-2.5 border-b border-chrome-border px-4">
                <Search className="h-4 w-4 shrink-0 text-chrome-muted" />
                <Command.Input
                  autoFocus
                  placeholder="Jump to a screen, or search an action..."
                  className="w-full bg-transparent py-3.5 text-[14px] text-chrome-ink placeholder:text-chrome-muted focus:outline-none"
                />
                <kbd className="rounded border border-chrome-border px-1.5 py-0.5 text-[10px] text-chrome-muted">ESC</kbd>
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-[13px] text-chrome-muted">No matches found.</Command.Empty>

                <Command.Group heading="Navigate" className="px-2 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-wider text-chrome-muted [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5">
                  {items.map((item) => (
                    <Command.Item
                      key={item.to}
                      value={item.label}
                      onSelect={() => go(item.to)}
                      className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] text-chrome-ink data-[selected=true]:bg-chrome-active"
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 text-chrome-muted group-data-[selected=true]:text-chrome-accent" />
                        {item.label}
                      </span>
                      <CornerDownLeft className="h-3.5 w-3.5 text-chrome-muted opacity-0 group-data-[selected=true]:opacity-100" />
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Session" className="px-2 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-wider text-chrome-muted [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5">
                  <Command.Item
                    value="Sign out"
                    onSelect={() => {
                      logout();
                      onClose();
                    }}
                    className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] text-status-critical data-[selected=true]:bg-chrome-active"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
