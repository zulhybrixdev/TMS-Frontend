import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api, ApiError } from "../../lib/api-client";
import type { SystemSetting } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDateTime } from "../../lib/format";

export function SettingsTab() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["system-settings"], queryFn: () => api.get<SystemSetting[]>("/system-settings") });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-3">
      <p className="mb-2 text-[13px] text-ink-secondary">
        These tunables control the treasury cash engine and approval workflow behaviour without requiring a code change.
      </p>
      {settings?.map((setting) => (
        <SettingRow key={setting.key} setting={setting} onSaved={() => qc.invalidateQueries({ queryKey: ["system-settings"] })} />
      ))}
    </div>
  );
}

function SettingRow({ setting, onSaved }: { setting: SystemSetting; onSaved: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm({ defaultValues: { value: setting.value } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.put(`/system-settings/${setting.key}`, { value: values.value, description: setting.description ?? undefined });
      toast.success("Setting updated");
      onSaved();
    } catch (err) {
      toast.error("Could not update setting", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border p-4">
      <div>
        <p className="font-mono text-[12px] text-ink-muted">{setting.key}</p>
        <p className="text-[13px] text-ink-secondary">{setting.description}</p>
        <p className="mt-1 text-[11px] text-ink-muted">Last updated {formatDateTime(setting.updatedAt)}</p>
      </div>
      <div className="flex items-end gap-2">
        <div>
          <Label htmlFor={setting.key}>Value</Label>
          <Input id={setting.key} {...register("value")} className="w-40" />
        </div>
        <Button type="submit" size="sm" variant="outline" loading={isSubmitting} disabled={!isDirty}>
          Save
        </Button>
      </div>
    </form>
  );
}
