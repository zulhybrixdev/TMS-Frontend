import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { KeyRound, Plus, UserX } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import { useListQuery } from "../../hooks/useListQuery";
import type { Role, UserRow } from "../../lib/types";
import { Toolbar } from "../../components/ui/Toolbar";
import { DataTable, Pagination, Column } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { Input, Label, Select, ErrorText } from "../../components/ui/Input";
import { formatDate } from "../../lib/format";

export function UsersTab() {
  const qc = useQueryClient();
  const list = useListQuery<UserRow>("admin-users", (params) => `/users?${params.toString()}`, { defaultSort: "createdAt" });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/roles") });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-ink-muted">{r.email}</p>
        </div>
      ),
    },
    { key: "jobTitle", header: "Job Title", render: (r) => r.jobTitle ?? "—" },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    { key: "roles", header: "Roles", render: (r) => <div className="flex flex-wrap gap-1">{r.roles.map((role) => <Badge key={role.id} tone="brand">{role.name}</Badge>)}</div> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "lastLoginAt", header: "Last Login", render: (r) => <span className="text-xs text-ink-muted">{r.lastLoginAt ? formatDate(r.lastLoginAt) : "Never"}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setResetTarget(r)} title="Reset password">
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          {r.status === "ACTIVE" && (
            <Button size="sm" variant="ghost" onClick={() => setDeactivateTarget(r)} title="Deactivate">
              <UserX className="h-3.5 w-3.5 text-status-critical" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search users..."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
      />

      {list.isLoading ? (
        <SkeletonTable cols={6} />
      ) : list.data.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <DataTable
          columns={columns}
          rows={list.data}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            setEditing(r);
            setFormOpen(true);
          }}
        />
      )}
      {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}

      {formOpen && <UserFormDialog user={editing} roles={roles ?? []} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); refresh(); }} />}

      {resetTarget && <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} onDone={() => setResetTarget(null)} />}

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={async () => {
          if (!deactivateTarget) return;
          try {
            await api.delete(`/users/${deactivateTarget.id}`);
            toast.success("User deactivated");
            refresh();
          } catch (err) {
            toast.error("Failed", { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setDeactivateTarget(null);
          }
        }}
        title="Deactivate user?"
        description={`${deactivateTarget?.name} will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        tone="danger"
      />
    </div>
  );
}

function UserFormDialog({ user, roles, onClose, onSaved }: { user: UserRow | null; roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user;
  const { data: departments } = useQuery({ queryKey: ["users", "departments"], queryFn: () => api.get<string[]>("/users/departments") });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: user?.email ?? "",
      name: user?.name ?? "",
      jobTitle: user?.jobTitle ?? "",
      department: user?.department ?? "",
      password: "",
      roleIds: user?.roles.map((r) => r.id) ?? ([] as string[]),
      status: user?.status ?? "ACTIVE",
    },
  });

  const selectedRoleIds = watch("roleIds");

  const toggleRole = (id: string) => {
    const set = new Set(selectedRoleIds);
    set.has(id) ? set.delete(id) : set.add(id);
    setValue("roleIds", Array.from(set));
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await api.patch(`/users/${user!.id}`, { name: values.name, jobTitle: values.jobTitle, department: values.department, status: values.status, roleIds: values.roleIds });
        toast.success("User updated");
      } else {
        await api.post("/users", { email: values.email, name: values.name, jobTitle: values.jobTitle, department: values.department, password: values.password, roleIds: values.roleIds });
        toast.success("User created");
      }
      onSaved();
    } catch (err) {
      toast.error("Could not save user", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? "Edit User" : "Add User"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="name" required>
              Full Name
            </Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>
          <div>
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input id="email" type="email" disabled={isEdit} {...register("email", { required: true })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" {...register("jobTitle")} />
          </div>
          <div>
            <Label htmlFor="department">Department / Cost Center</Label>
            <Input id="department" list="department-options" placeholder="e.g. Finance, Ops" {...register("department")} />
            <datalist id="department-options">
              {departments?.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>
        {!isEdit && (
          <div>
            <Label htmlFor="password" required>
              Temporary Password
            </Label>
            <Input id="password" type="password" {...register("password", { required: !isEdit, minLength: 8 })} />
            <ErrorText>{errors.password && "Minimum 8 characters"}</ErrorText>
          </div>
        )}
        {isEdit && (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </Select>
          </div>
        )}
        <div>
          <Label required>Roles</Label>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                type="button"
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  selectedRoleIds.includes(role.id) ? "border-brand bg-brand-soft text-brand" : "border-border text-ink-secondary hover:bg-plane"
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose, onDone }: { user: UserRow; onClose: () => void; onDone: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { newPassword: "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post(`/users/${user.id}/reset-password`, values);
      toast.success("Password reset", { description: `Share the new password with ${user.name} securely.` });
      onDone();
    } catch (err) {
      toast.error("Could not reset password", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reset password for ${user.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            Reset Password
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <Label htmlFor="newPassword" required>
          New Password
        </Label>
        <Input id="newPassword" type="password" {...register("newPassword", { required: true, minLength: 8 })} />
      </form>
    </Dialog>
  );
}
