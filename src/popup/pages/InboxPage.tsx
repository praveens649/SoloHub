import { ActionCenter } from "../components/ActionCenter";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function InboxPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-base font-bold text-[#FAFAFA]">
          Developer Inbox
        </h1>
        <p className="text-xs text-[#71717A]">
          Actionable pull requests and issues requiring your attention
        </p>
      </div>

      <ErrorBoundary>
        <ActionCenter showHeader={true} />
      </ErrorBoundary>
    </div>
  );
}
