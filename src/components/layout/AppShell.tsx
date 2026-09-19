import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { CommandPalette } from "./CommandPalette";
import { NAV_ITEMS } from "./nav-config";
import { useAuth } from "../../lib/auth-context";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { hasPermission } = useAuth();
  const location = useLocation();
  const items = NAV_ITEMS.filter((item) => !item.permission || hasPermission(...item.permission));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-plane">
      <Sidebar />

      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="ledger-grid absolute inset-y-0 left-0 w-72 bg-chrome p-4 shadow-popover"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-chrome-ink">Menu</p>
                <button onClick={() => setMobileNavOpen(false)} className="rounded-md p-1.5 text-chrome-muted hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      clsx("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium", isActive ? "bg-chrome-active text-chrome-accent" : "text-chrome-muted hover:bg-white/5")
                    }
                  >
                    <item.icon className="h-[17px] w-[17px]" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <ImpersonationBanner />
        <Topbar onMenu={() => setMobileNavOpen(true)} onSearch={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-[1400px] px-4 py-6 md:px-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
