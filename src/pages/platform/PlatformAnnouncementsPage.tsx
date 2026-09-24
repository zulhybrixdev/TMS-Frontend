import { usePlatformAuth } from "../../lib/platform-auth-context";
import { AnnouncementsPanel } from "./AnnouncementsPanel";

export default function PlatformAnnouncementsPage() {
  const { connected } = usePlatformAuth();
  return (
    <>
      <div className="mb-2">
        <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Announcements</h1>
        <p className="mt-1 text-sm text-ink-secondary">Notices shown to every user - scheduled maintenance, planned downtime, news.</p>
      </div>
      <AnnouncementsPanel connected={connected} />
    </>
  );
}
