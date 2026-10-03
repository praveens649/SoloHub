import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FolderPlus,
  Globe,
  Lock,
  Plus,
  Users,
} from "lucide-react";
import { useCreateRepository } from "../hooks/useRepositories";
import { CollaboratorSection } from "./CollaboratorSection";
import type { GitHubRepository } from "../../lib/github/types";
import { GitHubApiError, formatGitHubError } from "../../lib/github/errors";

type QuickActionMode = "none" | "create-repo" | "manage-access";

export function QuickActions() {
  const [mode, setMode] = useState<QuickActionMode>("none");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdRepo, setCreatedRepo] = useState<GitHubRepository | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState<"https" | "ssh" | null>(
    null
  );

  const createMutation = useCreateRepository();

  function resetForm() {
    setName("");
    setDescription("");
    setIsPrivate(false);
    setAutoInit(true);
    setValidationError(null);
    setApiError(null);
    setCreatedRepo(null);
    setCopiedProtocol(null);
  }

  function handleClose() {
    resetForm();
    setMode("none");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError("Repository name is required.");
      return;
    }

    setValidationError(null);
    setApiError(null);

    try {
      const repo = await createMutation.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
        private: isPrivate,
        autoInit,
      });

      setCreatedRepo(repo);
    } catch (err) {
      if (err instanceof GitHubApiError) {
        if (err.isRateLimit) {
          setApiError(err.getFriendlyMessage());
          return;
        }
        if (
          err.status === 422 ||
          err.message.toLowerCase().includes("already exists")
        ) {
          setApiError("Repository name already exists.");
          return;
        }
        setApiError(err.getFriendlyMessage());
        return;
      }
      setApiError(formatGitHubError(err, "Unable to create repository."));
    }
  }

  async function copyCommands(protocol: "https" | "ssh") {
    if (!createdRepo) return;

    const remoteUrl =
      protocol === "https" ? createdRepo.clone_url : createdRepo.ssh_url;
    const commands = `git remote add origin ${remoteUrl}\ngit push -u origin main`;

    try {
      await navigator.clipboard.writeText(commands);
      setCopiedProtocol(protocol);
      setTimeout(() => setCopiedProtocol(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <section>
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Shortcuts</p>
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>
      </div>

      {/* Default View: Action Cards */}
      {mode === "none" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setMode("create-repo")}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-800/80 text-white">
                <FolderPlus size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Create Repository
                </p>
                <p className="text-[11px] text-zinc-400">
                  Create a new GitHub repo
                </p>
              </div>
            </div>

            <Plus size={14} className="text-zinc-500" />
          </button>

          <button
            type="button"
            onClick={() => setMode("manage-access")}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-800/80 text-white">
                <Users size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Manage Access
                </p>
                <p className="text-[11px] text-zinc-400">
                  Manage repository collaborators
                </p>
              </div>
            </div>

            <Plus size={14} className="text-zinc-500" />
          </button>
        </div>
      )}

      {/* Success View */}
      {mode === "create-repo" && createdRepo && (
        <div className="space-y-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400">
                Repository created
              </p>
              <h3 className="mt-0.5 text-sm font-semibold text-white">
                {createdRepo.full_name}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => chrome.tabs.create({ url: createdRepo.html_url })}
              className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              <ExternalLink size={12} />
              Open
            </button>
          </div>

          {/* Terminal Remote Commands */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-medium text-zinc-400">
              Terminal remote commands:
            </p>

            {/* HTTPS commands */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-2 text-[10px]">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-medium text-zinc-300">HTTPS</span>
                <button
                  type="button"
                  onClick={() => copyCommands("https")}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 transition hover:text-white"
                >
                  {copiedProtocol === "https" ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <code className="mt-1 block font-mono text-zinc-400">
                git remote add origin {createdRepo.clone_url}
                <br />
                git push -u origin main
              </code>
            </div>

            {/* SSH commands */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-2 text-[10px]">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-medium text-zinc-300">SSH</span>
                <button
                  type="button"
                  onClick={() => copyCommands("ssh")}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 transition hover:text-white"
                >
                  {copiedProtocol === "ssh" ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <code className="mt-1 block font-mono text-zinc-400">
                git remote add origin {createdRepo.ssh_url}
                <br />
                git push -u origin main
              </code>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Creation Form View */}
      {mode === "create-repo" && !createdRepo && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white">
              Create a new repository
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>

          {/* Validation or API error */}
          {(validationError || apiError) && (
            <p className="rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
              {validationError || apiError}
            </p>
          )}

          {/* Repository Name */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-400">
              Repository name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., my-awesome-project"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              disabled={createMutation.isPending}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-400">
              Description <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Short description of your project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
            />
          </div>

          {/* Visibility Options */}
          <div>
            <label className="mb-1 block text-[11px] text-zinc-400">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs transition ${
                  !isPrivate
                    ? "border-white/40 bg-zinc-800/80 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="sr-only"
                />
                <Globe size={13} className="shrink-0" />
                <span>Public</span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs transition ${
                  isPrivate
                    ? "border-white/40 bg-zinc-800/80 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="sr-only"
                />
                <Lock size={13} className="shrink-0" />
                <span>Private</span>
              </label>
            </div>
          </div>

          {/* Initialize with README */}
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={autoInit}
              onChange={(e) => setAutoInit(e.target.checked)}
              disabled={createMutation.isPending}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-white accent-white"
            />
            <span>Initialize with README</span>
          </label>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
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
              {createMutation.isPending ? "Creating..." : "Create Repository"}
            </button>
          </div>
        </form>
      )}

      {/* Manage Access View */}
      {mode === "manage-access" && (
        <CollaboratorSection onClose={handleClose} />
      )}
    </section>
  );
}
