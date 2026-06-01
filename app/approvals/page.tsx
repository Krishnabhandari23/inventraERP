import { AppShell } from "@/components/AppShell";
import { ApprovalsBuilder } from "@/components/ApprovalsBuilder";
import { CommentsThread } from "@/components/Comments";
import { ToastProvider } from "@/components/Toast";

export default function ApprovalsPage() {
  return (
    <ToastProvider>
      <AppShell>
        <header className="flex items-center gap-3 water-in">
          <h1 className="text-xl font-semibold">Approvals & Collaboration</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ApprovalsBuilder />
          <CommentsThread objectRef="PO #1991" />
        </div>
      </AppShell>
    </ToastProvider>
  );
}
