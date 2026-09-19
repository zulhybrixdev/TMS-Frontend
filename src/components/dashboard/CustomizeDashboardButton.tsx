import { useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { useHasModule } from "../../hooks/useSubscription";
import { DASHBOARD_WIDGETS, useDashboardWidgetPrefs } from "../../hooks/useDashboardWidgetPrefs";

// Pro+ only - renders nothing at all for other plans (not even a locked
// button) since this is a personalisation nicety, not a feature worth an
// upgrade nag on every Dashboard visit the way a real module gate is.
export function CustomizeDashboardButton() {
  const { hasModule } = useHasModule("advanced_insights");
  const { prefs, isVisible, save } = useDashboardWidgetPrefs(hasModule);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  if (!hasModule) return null;

  const openDialog = () => {
    setDraft(Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.key, isVisible(w.key)])));
    setOpen(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ ...prefs, ...draft });
      toast.success("Dashboard layout saved");
      setOpen(false);
    } catch {
      toast.error("Could not save layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <Settings2 className="h-3.5 w-3.5" /> Customize
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Customize Dashboard"
        description="Choose which sections show on your Dashboard - saved to your account, just for you."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          {DASHBOARD_WIDGETS.map((w) => (
            <label key={w.key} className="flex items-center justify-between rounded-lg px-2 py-2 text-[13.5px] text-ink hover:bg-plane">
              {w.label}
              <input
                type="checkbox"
                checked={draft[w.key] ?? true}
                onChange={(e) => setDraft((d) => ({ ...d, [w.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-brand"
              />
            </label>
          ))}
        </div>
      </Dialog>
    </>
  );
}
