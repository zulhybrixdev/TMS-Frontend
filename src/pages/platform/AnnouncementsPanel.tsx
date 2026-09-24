import { useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Megaphone, Pencil, Plus, Square, Trash2 } from "lucide-react";
import type { ConnectedEnvironment } from "../../lib/platform-auth-context";
import { platformApiFor, ApiError } from "../../lib/platform-api-client";
import type { PlatformEnvironment } from "../../lib/platform-environments";
import type { Announcement, AnnouncementType } from "../../lib/types";
import { AnnouncementView } from "../../components/AnnouncementBanner";
import { MaintenanceView } from "../../components/MaintenanceGate";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { ConfirmDialog, Dialog } from "../../components/ui/Dialog";
import { Input, Label, Select, Textarea } from "../../components/ui/Input";

type Row = Announcement & { status: "SCHEDULED" | "LIVE" | "ENDED"; env: PlatformEnvironment };

const TYPE_LABEL: Record<AnnouncementType, string> = { INFO: "Info", MAINTENANCE: "Maintenance", DOWNTIME: "Downtime" };
const TYPE_TONE = { INFO: "brand", MAINTENANCE: "warning", DOWNTIME: "critical" } as const;
const STATUS_TONE = { LIVE: "good", SCHEDULED: "warning", ENDED: "neutral" } as const;

// <input type="datetime-local"> works in the browser's local time; the API takes ISO.
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const inHours = (h: number) => toLocalInput(new Date(Date.now() + h * 3600_000).toISOString());
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// Platform Console: write, schedule, end and delete announcements. Each environment
// (dev / uat / production) keeps its own announcements in its own database, so
// creating one for several environments posts it to each of them.
export function AnnouncementsPanel({ connected }: { connected: ConnectedEnvironment[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [toEnd, setToEnd] = useState<Row | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const results = useQueries({
    queries: connected.map((c) => ({
      queryKey: ["platform", "announcements", c.env.key],
      queryFn: () => platformApiFor(c.env).get<(Announcement & { status: Row["status"] })[]>("/announcements"),
      refetchInterval: 30_000,
    })),
  });

  const rows: Row[] = useMemo(() => {
    const order = { LIVE: 0, SCHEDULED: 1, ENDED: 2 };
    return connected
      .flatMap((c, i) => (results[i]?.data ?? []).map((a): Row => ({ ...a, env: c.env })))
      .sort((a, b) => order[a.status] - order[b.status] || new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, results.map((r) => r.dataUpdatedAt).join(",")]);

  const refresh = (envKey: string) => qc.invalidateQueries({ queryKey: ["platform", "announcements", envKey] });

  const run = async (row: Row, action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(`${done} on ${row.env.label}`);
      refresh(row.env.key);
    } catch (err) {
      toast.error("Could not update the announcement", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
      setToEnd(null);
      setToDelete(null);
    }
  };

  const live = rows.filter((r) => r.status === "LIVE").length;

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex-wrap">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-ink-muted" /> Announcements
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {live > 0 && <Badge tone="good" dot>{live} live</Badge>}
            <Button size="sm" className="whitespace-nowrap" onClick={() => setEditing("new")}>
              <Plus className="h-3.5 w-3.5" /> New announcement
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-[13px] text-ink-secondary">
            A banner shown to every user of the environments you choose - on the sign-in page too, so people see downtime notices before they try to sign in. Use it for scheduled maintenance, planned downtime or news. It appears at the start time and disappears at the end time by itself. Maintenance and downtime can also lock the system: users then see a full-screen notice instead of the app, and get back in by themselves when it ends.
          </p>
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[13px] text-ink-muted">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {rows.map((r) => (
                <li key={`${r.env.key}:${r.id}`} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[r.status]} dot={r.status === "LIVE"}>{r.status === "LIVE" ? "Live" : r.status === "SCHEDULED" ? "Scheduled" : "Ended"}</Badge>
                      <Badge tone={TYPE_TONE[r.type]}>{TYPE_LABEL[r.type]}</Badge>
                      <Badge tone="neutral">{r.env.label}</Badge>
                      {r.blocking && r.status !== "ENDED" && <Badge tone="critical"><Lock className="h-3 w-3" /> Locks the system</Badge>}
                      <span className="text-[11px] text-ink-muted">{r.persistent ? "Stays on screen" : "Users can dismiss"}</span>
                    </div>
                    <p className="mt-1 text-[14px] font-medium text-ink">{r.titleEn}</p>
                    <p className="text-[12px] text-ink-muted">
                      Shown {fmt(r.startsAt)} → {fmt(r.endsAt)}
                      {r.affectedFrom && r.affectedTo ? ` · affected ${fmt(r.affectedFrom)} → ${fmt(r.affectedTo)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {r.status !== "ENDED" && (
                      <Button size="sm" variant="outline" onClick={() => setToEnd(r)}>
                        <Square className="h-3.5 w-3.5" /> End now
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setToDelete(r)} aria-label="Delete announcement">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {editing && (
        <AnnouncementDialog
          connected={connected}
          existing={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(envKeys) => {
            envKeys.forEach(refresh);
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!toEnd}
        onClose={() => setToEnd(null)}
        loading={busy}
        onConfirm={() => toEnd && run(toEnd, () => platformApiFor(toEnd.env).post(`/announcements/${toEnd.id}/end`), "Announcement ended")}
        title="End this announcement now?"
        description={toEnd?.locked ? `This lifts the lock on ${toEnd.env.label}: users get back into the system within seconds, without reloading. The record is kept.` : "Users stop seeing it within a few seconds. The record is kept."}
        confirmLabel="End now"
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        onConfirm={() => toDelete && run(toDelete, () => platformApiFor(toDelete.env).delete(`/announcements/${toDelete.id}`), "Announcement deleted")}
        title="Delete this announcement?"
        description={toDelete?.locked ? `It disappears for users and is removed permanently. It is locking ${toDelete.env.label} right now, so deleting it also lifts the lock.` : "It disappears for users and is removed permanently."}
        confirmLabel="Delete"
      />
    </>
  );
}

function AnnouncementDialog({ connected, existing, onClose, onSaved }: { connected: ConnectedEnvironment[]; existing: Row | null; onClose: () => void; onSaved: (envKeys: string[]) => void }) {
  const [envKeys, setEnvKeys] = useState<string[]>(existing ? [existing.env.key] : connected.filter((c) => c.env.key !== "dev").map((c) => c.env.key));
  const [type, setType] = useState<AnnouncementType>(existing?.type ?? "INFO");
  const [persistent, setPersistent] = useState(existing?.persistent ?? false);
  const [blocking, setBlocking] = useState(existing?.blocking ?? false);
  const [titleEn, setTitleEn] = useState(existing?.titleEn ?? "");
  const [titleMs, setTitleMs] = useState(existing?.titleMs ?? "");
  const [messageEn, setMessageEn] = useState(existing?.messageEn ?? "");
  const [messageMs, setMessageMs] = useState(existing?.messageMs ?? "");
  const [startsAt, setStartsAt] = useState(existing ? toLocalInput(existing.startsAt) : inHours(0));
  const [endsAt, setEndsAt] = useState(existing ? toLocalInput(existing.endsAt) : inHours(24));
  const [affectedFrom, setAffectedFrom] = useState(toLocalInput(existing?.affectedFrom));
  const [affectedTo, setAffectedTo] = useState(toLocalInput(existing?.affectedTo));
  const [previewLang, setPreviewLang] = useState<"en" | "ms">("en");
  const [saving, setSaving] = useState(false);

  const pickType = (next: AnnouncementType) => {
    setType(next);
    setPersistent(next === "DOWNTIME"); // downtime stays on screen by default; the choice can still be changed below
    setBlocking(next !== "INFO" && (existing ? blocking : true)); // a real outage locks the system by default; an info notice never does
  };

  const problem =
    envKeys.length === 0 ? "Choose at least one environment." :
    !titleEn.trim() || !messageEn.trim() ? "An English title and message are required." :
    !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt) ? "The end time must be after the start time." :
    !!affectedFrom !== !!affectedTo ? "Give both the start and end of the affected window, or neither." :
    affectedFrom && affectedTo && new Date(affectedTo) <= new Date(affectedFrom) ? "The affected window must end after it starts." :
    blocking && affectedTo && new Date(endsAt) < new Date(affectedTo) ? "Hide at must not be before the affected window ends, or the lock would lift early." : null;

  const preview: Announcement = {
    id: "preview", type, titleEn: titleEn || "Title", titleMs: titleMs || null, messageEn: messageEn || "Your message appears here.", messageMs: messageMs || null,
    startsAt: fromLocalInput(startsAt) ?? new Date().toISOString(), endsAt: fromLocalInput(endsAt) ?? new Date().toISOString(),
    affectedFrom: fromLocalInput(affectedFrom), affectedTo: fromLocalInput(affectedTo), persistent,
    blocking: blocking && type !== "INFO", locked: blocking && type !== "INFO", lockedUntil: fromLocalInput(affectedTo) ?? fromLocalInput(endsAt),
  };

  const save = async () => {
    if (problem) return;
    setSaving(true);
    const body = {
      type, persistent, blocking: blocking && type !== "INFO", titleEn: titleEn.trim(), titleMs: titleMs.trim(), messageEn: messageEn.trim(), messageMs: messageMs.trim(),
      startsAt: fromLocalInput(startsAt), endsAt: fromLocalInput(endsAt), affectedFrom: fromLocalInput(affectedFrom), affectedTo: fromLocalInput(affectedTo),
    };
    const saved: string[] = [];
    for (const key of envKeys) {
      const conn = connected.find((c) => c.env.key === key)!;
      try {
        const api = platformApiFor(conn.env);
        if (existing) await api.put(`/announcements/${existing.id}`, body);
        else await api.post("/announcements", body);
        saved.push(key);
      } catch (err) {
        toast.error(`Could not save on ${conn.env.label}`, { description: err instanceof ApiError ? err.message : undefined });
      }
    }
    setSaving(false);
    if (saved.length) {
      toast.success(existing ? "Announcement updated" : `Announcement posted to ${saved.map((k) => connected.find((c) => c.env.key === k)!.env.label).join(", ")}`);
      onSaved(saved);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={existing ? "Edit announcement" : "New announcement"}
      description="Shown as a banner to every user of the chosen environments, between the start and end times."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!!problem}>{existing ? "Save changes" : "Post announcement"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {!existing && (
          <div>
            <Label>Environments</Label>
            <div className="flex flex-wrap gap-3">
              {connected.map((c) => (
                <label key={c.env.key} className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                  <input type="checkbox" checked={envKeys.includes(c.env.key)} onChange={(e) => setEnvKeys((k) => (e.target.checked ? [...k, c.env.key] : k.filter((x) => x !== c.env.key)))} />
                  {c.env.label}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="an-type">Type</Label>
            <Select id="an-type" value={type} onChange={(e) => pickType(e.target.value as AnnouncementType)}>
              <option value="INFO">Info - news, tips</option>
              <option value="MAINTENANCE">Scheduled maintenance</option>
              <option value="DOWNTIME">Planned downtime</option>
            </Select>
          </div>
          <div>
            <Label>Users can</Label>
            <Select value={persistent ? "stay" : "dismiss"} onChange={(e) => setPersistent(e.target.value === "stay")} aria-label="Persistence">
              <option value="dismiss">Dismiss it (non-persistent)</option>
              <option value="stay">Not dismiss it (persistent)</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="an-te" required>Title (English)</Label>
            <Input id="an-te" value={titleEn} maxLength={160} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. Scheduled maintenance on Saturday" />
          </div>
          <div>
            <Label htmlFor="an-tm">Title (Bahasa Malaysia)</Label>
            <Input id="an-tm" value={titleMs} maxLength={160} onChange={(e) => setTitleMs(e.target.value)} placeholder="Optional - English is used if empty" />
          </div>
          <div>
            <Label htmlFor="an-me" required>Message (English)</Label>
            <Textarea id="an-me" rows={3} value={messageEn} maxLength={1500} onChange={(e) => setMessageEn(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="an-mm">Message (Bahasa Malaysia)</Label>
            <Textarea id="an-mm" rows={3} value={messageMs} maxLength={1500} onChange={(e) => setMessageMs(e.target.value)} placeholder="Optional - English is used if empty" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="an-s" required>Show from</Label>
            <Input id="an-s" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="an-e" required>Hide at</Label>
            <Input id="an-e" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        {type !== "INFO" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="an-af">Affected from (optional)</Label>
              <Input id="an-af" type="datetime-local" value={affectedFrom} onChange={(e) => setAffectedFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="an-at">Affected until</Label>
              <Input id="an-at" type="datetime-local" value={affectedTo} onChange={(e) => setAffectedTo(e.target.value)} />
            </div>
            <p className="col-span-2 -mt-1 text-[11.5px] text-ink-muted">The actual maintenance / outage window. It is written into the banner so people know exactly when. Times are in your browser's timezone.</p>
          </div>
        )}
        {type !== "INFO" && (
          <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] ${blocking ? "border-status-critical/40 bg-status-critical-soft" : "border-border"}`}>
            <input type="checkbox" className="mt-0.5" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
            <span>
              <span className="flex items-center gap-1.5 font-medium text-ink"><Lock className="h-3.5 w-3.5" /> Lock the system while this is live</span>
              <span className="mt-0.5 block text-[12px] text-ink-secondary">
                Users see a full-screen notice and cannot use or sign in to the system - for real, the server refuses their requests too. The lock covers the affected window (or the whole show-from → hide-at period if none is set) and lifts by itself, or the moment you End or Delete this announcement. Platform Console keeps working, and so do payment-gateway callbacks. Anyone with the app open gets back in automatically, without reloading.
              </span>
            </span>
          </label>
        )}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Preview</Label>
            <div className="inline-flex rounded-md border border-border p-0.5 text-[11px]">
              {(["en", "ms"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setPreviewLang(l)} className={`rounded px-2 py-0.5 font-semibold ${previewLang === l ? "bg-brand text-white" : "text-ink-secondary"}`}>
                  {l === "en" ? "English" : "Bahasa Malaysia"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <AnnouncementView item={preview} lang={previewLang} onDismiss={persistent ? undefined : () => {}} />
          </div>
          {preview.locked && (
            <>
              <p className="mb-1.5 mt-3 text-[11.5px] font-medium text-ink-muted">What users see while it is locked (full screen for them):</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <MaintenanceView item={preview} lang={previewLang} inline />
              </div>
            </>
          )}
        </div>
        {problem && <p className="text-[12.5px] text-status-critical">{problem}</p>}
      </div>
    </Dialog>
  );
}
