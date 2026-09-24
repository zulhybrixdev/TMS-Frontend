import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Lock, Plus } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { Permission, Role } from "../../lib/types";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { Input, Label, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { t } from "../../i18n";

export function RolesTab() {
  const qc = useQueryClient();
  const { data: roles, isLoading } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/roles") });
  const { data: permissions } = useQuery({ queryKey: ["permissions"], queryFn: () => api.get<Permission[]>("/roles/permissions") });
  const [editing, setEditing] = useState<Role | null | "new">(null);

  const grouped = permissions?.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> {t("Add Role")}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles?.map((role) => (
          <Card key={role.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                    {role.name}
                    {role.isSystem && <Lock className="h-3 w-3 text-ink-muted" />}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">{role.userCount} {t("user(s)")}</p>
                </div>
                {!role.isSystem && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(role)}>
                    {t("Edit")}
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[13px] text-ink-secondary">{role.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {role.permissions.slice(0, 8).map((p) => (
                  <Badge key={p} tone="neutral">
                    {p}
                  </Badge>
                ))}
                {role.permissions.length > 8 && <Badge tone="neutral">+{role.permissions.length - 8} {t("more")}</Badge>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {editing && (
        <RoleFormDialog
          role={editing === "new" ? null : editing}
          grouped={grouped ?? {}}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["roles"] });
          }}
        />
      )}
    </div>
  );
}

function RoleFormDialog({ role, grouped, onClose, onSaved }: { role: Role | null; grouped: Record<string, Permission[]>; onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { name: role?.name ?? "", description: role?.description ?? "", permissionCodes: role?.permissions ?? ([] as string[]) } });
  const selected = watch("permissionCodes");

  const toggle = (code: string) => {
    const set = new Set(selected);
    set.has(code) ? set.delete(code) : set.add(code);
    setValue("permissionCodes", Array.from(set));
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (role) await api.patch(`/roles/${role.id}`, values);
      else await api.post("/roles", values);
      toast.success(t("Role saved"));
      onSaved();
    } catch (err) {
      toast.error(t("Could not save role"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={role ? t("Edit {name}", { name: role.name }) : t("Add Role")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {t("Save")}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="name" required>
              {t("Role Name")}
            </Label>
            <Input id="name" {...register("name", { required: true })} disabled={!!role} />
          </div>
        </div>
        <div>
          <Label htmlFor="description">{t("Description")}</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>
        <div>
          <Label required>{t("Permissions")}</Label>
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
            {Object.entries(grouped).map(([module, perms]) => (
              <div key={module}>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{module}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {perms.map((p) => (
                    <button
                      type="button"
                      key={p.code}
                      onClick={() => toggle(p.code)}
                      className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${
                        selected.includes(p.code) ? "border-brand bg-brand-soft text-brand" : "border-border text-ink-secondary hover:bg-plane"
                      }`}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
