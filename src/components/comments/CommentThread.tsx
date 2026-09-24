import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { CommentRow, MentionableUser } from "../../lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { formatRelative, initials } from "../../lib/format";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";
import { t } from "../../i18n";

// Renders "@Name" spans found in a comment body as highlighted chips - the
// body is stored as plain text (see backend comments.service.ts), this is
// purely a display-time transform, not markup stored in the DB.
function renderBody(body: string, mentioned: MentionableUser[]) {
  if (mentioned.length === 0) return body;
  const names = mentioned.map((u) => u.name).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = body.split(pattern);
  return parts.map((part, i) => (names.includes(part) ? <span key={i} className="font-medium text-brand">@{part}</span> : <span key={i}>{part}</span>));
}

export function CommentThread({ entityType, entityId }: { entityType: "PAYMENT" | "TRANSFER"; entityId: string }) {
  const { user, hasPermission } = useAuth();
  const qc = useQueryClient();
  const canModerate = hasPermission(PERMISSIONS.SETTINGS_MANAGE);
  const [body, setBody] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: () => api.get<CommentRow[]>(`/comments?entityType=${entityType}&entityId=${entityId}`),
  });

  const { data: mentionableUsers } = useQuery({
    queryKey: ["comments", "mentionable-users"],
    queryFn: () => api.get<MentionableUser[]>("/comments/mentionable-users"),
  });

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null || !mentionableUsers) return [];
    const q = mentionQuery.toLowerCase();
    return mentionableUsers.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, mentionableUsers]);

  const onBodyChange = (value: string) => {
    setBody(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const uptoCursor = value.slice(0, cursor);
    const match = /@([\w .-]*)$/.exec(uptoCursor);
    setMentionQuery(match ? match[1] : null);
  };

  const pickMention = (u: MentionableUser) => {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const uptoCursor = body.slice(0, cursor);
    const replaced = uptoCursor.replace(/@([\w .-]*)$/, `@${u.name} `);
    setBody(replaced + body.slice(cursor));
    setMentionedUserIds((ids) => Array.from(new Set([...ids, u.id])));
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/comments", { entityType, entityId, body: body.trim(), mentionedUserIds });
      setBody("");
      setMentionedUserIds([]);
      qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
    } catch (err) {
      toast.error(t("Could not post comment"), { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/comments/${id}`);
      qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
    } catch (err) {
      toast.error(t("Could not delete comment"), { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-ink-muted" /> {t("Comments")} {comments && comments.length > 0 ? `(${comments.length})` : ""}
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((c) => {
              const authored = c.mentionedUserIds.length > 0 && mentionableUsers ? mentionableUsers.filter((u) => c.mentionedUserIds.includes(u.id)) : [];
              return (
                <div key={c.id} className="group flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">{initials(c.author.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-ink">{c.author.name}</p>
                      <p className="text-[11px] text-ink-muted">{formatRelative(c.createdAt)}</p>
                      {(c.author.id === user?.id || canModerate) && (
                        <button onClick={() => remove(c.id)} className="ml-auto text-ink-muted opacity-0 transition-opacity hover:text-status-critical group-hover:opacity-100" aria-label={t("Delete comment")}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] text-ink-secondary">{renderBody(c.body, authored)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-ink-muted">{t("No comments yet - start the discussion below.")}</p>
        )}

        <div className="relative border-t border-border pt-3">
          <Textarea
            ref={textareaRef}
            rows={2}
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder={t("Add a comment - type @ to mention a colleague...")}
            className="text-[13.5px]"
          />
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="absolute bottom-[calc(100%+4px)] left-0 z-10 w-56 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-popover">
              {mentionMatches.map((u) => (
                <button
                  key={u.id}
                  onClick={() => pickMention(u)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-plane"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-[9px] font-semibold text-brand">{initials(u.name)}</div>
                  {u.name}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={submit} loading={submitting} disabled={!body.trim()}>
              <Send className="h-3.5 w-3.5" /> {t("Comment")}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
