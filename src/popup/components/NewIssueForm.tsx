import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useRepositories } from "../hooks/useRepositories";
import { useCreateIssue } from "../hooks/useIssues";
import type { GitHubIssue } from "../../lib/github/client";

interface NewIssueFormProps {
  onClose: () => void;
}

export function NewIssueForm({ onClose }: NewIssueFormProps) {
  const { data: repositories, isLoading: reposLoading } = useRepositories();
  const createMutation = useCreateIssue();

  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<GitHubIssue | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedRepoFullName) {
      setFormError("Please select a repository.");
      return;
    }

    if (!title.trim()) {
      setFormError("Issue title is required.");
      return;
    }

    const selectedRepo = repositories?.find(
      (repo) => repo.full_name === selectedRepoFullName
    );

    if (!selectedRepo) {
      setFormError("Selected repository not found.");
      return;
    }

    try {
      setFormError(null);

      const issue = await createMutation.mutateAsync({
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        title: title.trim(),
        body: description.trim() || undefined,
      });

      setCreatedIssue(issue);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create issue.";
      setFormError(message);
    }
  }

  function handleOpenCreated() {
    if (createdIssue?.html_url) {
      chrome.tabs.create({ url: createdIssue.html_url });
    }
  }

  if (createdIssue) {
    return (
      <div className="space-y-2 rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3">
        <p className="text-xs font-semibold text-emerald-400">
          Issue #{createdIssue.number} created successfully!
        </p>

        <p className="truncate text-[11px] text-zinc-300">
          {createdIssue.title}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleOpenCreated}
            className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            <ExternalLink size={12} />
            Open Issue
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Create Issue</h3>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>

      {formError && (
        <p className="rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
          {formError}
        </p>
      )}

      {/* Repository selector */}
      <div>
        <label className="mb-1 block text-[11px] text-zinc-400">
          Repository
        </label>

        <select
          value={selectedRepoFullName}
          onChange={(e) => setSelectedRepoFullName(e.target.value)}
          disabled={reposLoading || createMutation.isPending}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-600 disabled:opacity-50"
        >
          <option value="" disabled>
            {reposLoading ? "Loading repositories..." : "Select repository..."}
          </option>

          {repositories?.map((repo) => (
            <option key={repo.id} value={repo.full_name}>
              {repo.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Title input */}
      <div>
        <label className="mb-1 block text-[11px] text-zinc-400">Title</label>

        <input
          type="text"
          placeholder="Issue title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={createMutation.isPending}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
        />
      </div>

      {/* Description textarea */}
      <div>
        <label className="mb-1 block text-[11px] text-zinc-400">
          Description <span className="text-zinc-600">(optional)</span>
        </label>

        <textarea
          rows={2}
          placeholder="Add issue description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={createMutation.isPending}
          className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={createMutation.isPending}
          className="rounded border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded bg-white px-3 py-1 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating..." : "Create Issue"}
        </button>
      </div>
    </form>
  );
}
