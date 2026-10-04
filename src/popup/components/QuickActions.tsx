import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FolderPlus,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { useCreateRepository } from "../hooks/useRepositories";
import { useOrganizations } from "../hooks/useOrganizations";
import { CollaboratorSection } from "./CollaboratorSection";
import type { GitHubRepository } from "../../lib/github/types";
import { GitHubApiError, formatGitHubError } from "../../lib/github/errors";
import { useToast } from "./feedback/ToastContext";

export type QuickActionMode = "none" | "create-repo" | "manage-access";

interface QuickActionsProps {
  initialMode?: QuickActionMode;
  onModeChange?: (mode: QuickActionMode) => void;
}

export function QuickActions({
  initialMode = "none",
  onModeChange,
}: QuickActionsProps) {
  const [mode, setMode] = useState<QuickActionMode>(initialMode);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string>("personal");
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdRepo, setCreatedRepo] = useState<GitHubRepository | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState<"https" | "ssh" | null>(
    null
  );

  const toast = useToast();
  const { data: organizations } = useOrganizations();

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const createMutation = useCreateRepository();

  function resetForm() {
    setName("");
    setDescription("");
    setSelectedOwner("personal");
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
    if (onModeChange) onModeChange("none");
  }

  function handleSelectMode(newMode: QuickActionMode) {
    resetForm();
    setMode(newMode);
    if (onModeChange) onModeChange(newMode);
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
        org: selectedOwner !== "personal" ? selectedOwner : undefined,
      });

      setCreatedRepo(repo);
      toast.success("✓ Repository created");
    } catch (err) {
      let message: string;
      if (err instanceof GitHubApiError) {
        if (err.isRateLimit) {
          message = err.getFriendlyMessage();
        } else if (
          err.status === 422 ||
          err.message.toLowerCase().includes("already exists")
        ) {
          message = "Repository name already exists.";
        } else {
          message = err.getFriendlyMessage();
        }
      } else {
        message = formatGitHubError(err, "Unable to create repository.");
      }
      setApiError(message);
      toast.error(message);
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
      console.error("Failed to copy commands:", err);
    }
  }

  function handleOpenRepo() {
    if (createdRepo?.html_url) {
      if (typeof chrome !== "undefined" && chrome.tabs?.create) {
        chrome.tabs.create({ url: createdRepo.html_url });
      } else {
        window.open(createdRepo.html_url, "_blank");
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode selection buttons */}
      {mode === "none" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelectMode("create-repo")}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 text-xs font-medium text-[#FAFAFA] transition-colors hover:border-[#3F3F46] hover:bg-[#18181B] cursor-pointer"
          >
            <FolderPlus size={15} className="text-[#A1A1AA]" />
            <span>Create Repository</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode("manage-access")}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 text-xs font-medium text-[#FAFAFA] transition-colors hover:border-[#3F3F46] hover:bg-[#18181B] cursor-pointer"
          >
            <Users size={15} className="text-[#A1A1AA]" />
            <span>Manage Access</span>
          </button>
        </div>
      )}

      {/* Success View for Create Repository */}
      {mode === "create-repo" && createdRepo && (
        <div className="space-y-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Check size={16} />
            <span className="text-xs font-semibold">Repository created</span>
          </div>

          <p className="text-xs text-[#FAFAFA] font-medium truncate">
            {createdRepo.full_name}
          </p>

          <button
            type="button"
            onClick={handleOpenRepo}
            className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-[#27272A] bg-[#0F0F11] text-xs font-medium text-[#FAFAFA] transition-colors hover:bg-[#18181B] cursor-pointer"
          >
            <span>Open Repository</span>
            <ExternalLink size={12} className="text-[#A1A1AA]" />
          </button>

          {/* Quick copy clone commands */}
          <div className="space-y-2 pt-1">
            <div className="rounded-md border border-[#27272A] bg-[#090A0F] p-2 text-[10px]">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span className="font-medium text-[#FAFAFA]">HTTPS</span>
                <button
                  type="button"
                  onClick={() => copyCommands("https")}
                  className="flex items-center gap-1 text-[10px] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA] cursor-pointer"
                >
                  {copiedProtocol === "https" ? (
                    <>
                      <Check size={10} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <code className="mt-1 block font-mono text-[#71717A] text-[10px]">
                git remote add origin {createdRepo.clone_url}
              </code>
            </div>

            <div className="rounded-md border border-[#27272A] bg-[#090A0F] p-2 text-[10px]">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span className="font-medium text-[#FAFAFA]">SSH</span>
                <button
                  type="button"
                  onClick={() => copyCommands("ssh")}
                  className="flex items-center gap-1 text-[10px] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA] cursor-pointer"
                >
                  {copiedProtocol === "ssh" ? (
                    <>
                      <Check size={10} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <code className="mt-1 block font-mono text-[#71717A] text-[10px]">
                git remote add origin {createdRepo.ssh_url}
              </code>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-[#27272A] bg-[#0F0F11] px-3 py-1 text-xs font-medium text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] cursor-pointer"
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
          className="space-y-3 rounded-lg border border-[#27272A] bg-[#0F0F11] p-3"
        >
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
            <h3 className="text-xs font-semibold text-[#FAFAFA]">
              Create Repository
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-[#71717A] transition-colors hover:text-[#FAFAFA] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {(validationError || apiError) && (
            <p className="rounded border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
              {validationError || apiError}
            </p>
          )}

          {organizations && organizations.length > 0 && (
            <div>
              <label className="mb-1 block text-[11px] text-[#A1A1AA]">
                Owner
              </label>
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                disabled={createMutation.isPending}
                className="h-8 w-full rounded-md border border-[#27272A] bg-[#090A0F] px-2 text-xs text-[#FAFAFA] outline-none focus:border-[#3F3F46] cursor-pointer"
              >
                <option value="personal">Personal Account</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.login}>
                    Organization: @{org.login}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] text-[#A1A1AA]">
              Repository name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., solohub-extension"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              disabled={createMutation.isPending}
              className="h-8 w-full rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none focus:border-[#3F3F46] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[#A1A1AA]">
              Description <span className="text-[#71717A]">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Brief description of the repository"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              className="h-8 w-full rounded-md border border-[#27272A] bg-[#090A0F] px-2.5 text-xs text-[#FAFAFA] placeholder-[#71717A] outline-none focus:border-[#3F3F46] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[#A1A1AA]">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs transition-colors ${
                  !isPrivate
                    ? "border-[#FAFAFA] bg-[#18181B] text-[#FAFAFA]"
                    : "border-[#27272A] bg-[#090A0F] text-[#71717A] hover:border-[#3F3F46]"
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
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs transition-colors ${
                  isPrivate
                    ? "border-[#FAFAFA] bg-[#18181B] text-[#FAFAFA]"
                    : "border-[#27272A] bg-[#090A0F] text-[#71717A] hover:border-[#3F3F46]"
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

          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-[#A1A1AA]">
            <input
              type="checkbox"
              checked={autoInit}
              onChange={(e) => setAutoInit(e.target.checked)}
              disabled={createMutation.isPending}
              className="h-3.5 w-3.5 rounded border-[#27272A] bg-[#090A0F] accent-white"
            />
            <span>Initialize with README</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="rounded-md border border-[#27272A] px-3 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-[#FAFAFA] px-3 py-1.5 text-xs font-semibold text-[#090A0F] transition-colors hover:bg-white disabled:opacity-50 cursor-pointer"
            >
              {createMutation.isPending ? "Creating..." : "Create Repository"}
            </button>
          </div>
        </form>
      )}

      {/* Manage Access View */}
      {mode === "manage-access" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FAFAFA]">
              Repository Access
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-[#71717A] hover:text-[#FAFAFA] cursor-pointer"
            >
              Back
            </button>
          </div>
          <CollaboratorSection onClose={handleClose} />
        </div>
      )}
    </div>
  );
}
