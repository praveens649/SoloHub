import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ExternalLink,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRepositories } from "../hooks/useRepositories";
import {
  useAddCollaborator,
  useCollaborators,
  useRemoveCollaborator,
} from "../hooks/useCollaborators";
import { getAuth } from "../../lib/storage/auth";
import type {
  CollaboratorPermission,
  GitHubCollaborator,
  GitHubRepository,
} from "../../lib/github/types";

interface CollaboratorSectionProps {
  onClose?: () => void;
  initialRepository?: GitHubRepository | null;
}

function getCollaboratorPermissionLabel(
  collaborator: GitHubCollaborator
): string {
  if (collaborator.role_name) {
    const role = collaborator.role_name.toLowerCase();
    if (role === "admin") return "Admin";
    if (role === "maintain") return "Maintain";
    if (role === "write" || role === "push") return "Write";
    if (role === "triage") return "Triage";
    if (role === "read" || role === "pull") return "Read";
    return (
      collaborator.role_name.charAt(0).toUpperCase() +
      collaborator.role_name.slice(1)
    );
  }

  const perms = collaborator.permissions;
  if (!perms) return "Permission unavailable";

  if (perms.admin) return "Admin";
  if (perms.maintain) return "Maintain";
  if (perms.push) return "Write";
  if (perms.triage) return "Triage";
  if (perms.pull) return "Read";

  return "Permission unavailable";
}

function formatCollaboratorError(
  err: unknown,
  defaultMessage: string
): string {
  if (!(err instanceof Error)) return defaultMessage;
  const msg = err.message.toLowerCase();

  if (
    msg.includes("403") ||
    msg.includes("permission") ||
    msg.includes("must have admin rights") ||
    msg.includes("must have push access")
  ) {
    return "You don't have permission to manage access for this repository.";
  }
  if (msg.includes("404") || msg.includes("not found")) {
    return "Repository or user not found.";
  }
  if (
    msg.includes("already a collaborator") ||
    msg.includes("already been invited")
  ) {
    return "User is already a collaborator or has a pending invitation.";
  }
  if (msg.includes("rate limit")) {
    return "GitHub rate limit reached.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Network error. Please try again.";
  }

  return err.message || defaultMessage;
}

export function CollaboratorSection({
  onClose,
  initialRepository,
}: CollaboratorSectionProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedRepoKey, setSelectedRepoKey] = useState<string>(
    initialRepository ? `${initialRepository.owner.login}/${initialRepository.name}` : ""
  );

  // Add collaborator form state
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<CollaboratorPermission>("push");
  const [addValidationError, setAddValidationError] = useState<string | null>(
    null
  );
  const [addApiError, setAddApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Removing confirmation state: stores username pending removal
  const [confirmRemovingUser, setConfirmRemovingUser] = useState<string | null>(
    null
  );
  const [removeApiError, setRemoveApiError] = useState<string | null>(null);

  const { data: repositories, isLoading: isLoadingRepos } = useRepositories();

  useEffect(() => {
    getAuth().then((auth) => {
      if (auth?.user?.login) {
        setCurrentUser(auth.user.login);
      }
    });
  }, []);

  // Derive selected repository
  const selectedRepo = repositories?.find(
    (r) => `${r.owner.login}/${r.name}` === selectedRepoKey
  );

  const owner = selectedRepo?.owner.login;
  const repoName = selectedRepo?.name;

  const {
    data: collaborators,
    isLoading: isLoadingCollaborators,
    isError: isCollaboratorsError,
    error: collaboratorsError,
  } = useCollaborators(owner, repoName);

  const addMutation = useAddCollaborator();
  const removeMutation = useRemoveCollaborator();

  function handleSelectRepo(value: string) {
    setSelectedRepoKey(value);
    setIsAdding(false);
    setSuccessMessage(null);
    setAddValidationError(null);
    setAddApiError(null);
    setConfirmRemovingUser(null);
    setRemoveApiError(null);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner || !repoName) return;

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setAddValidationError("GitHub username is required.");
      return;
    }

    setAddValidationError(null);
    setAddApiError(null);
    setSuccessMessage(null);

    try {
      await addMutation.mutateAsync({
        owner,
        repo: repoName,
        username: trimmedUser,
        permission,
      });

      setSuccessMessage(`Invitation sent to @${trimmedUser}.`);
      setUsername("");
      setPermission("push");
      setIsAdding(false);
    } catch (err) {
      setAddApiError(
        formatCollaboratorError(err, "Unable to add collaborator.")
      );
    }
  }

  async function handleConfirmRemove(collaboratorLogin: string) {
    if (!owner || !repoName) return;

    setRemoveApiError(null);
    setSuccessMessage(null);

    try {
      await removeMutation.mutateAsync({
        owner,
        repo: repoName,
        username: collaboratorLogin,
      });

      setConfirmRemovingUser(null);
      setSuccessMessage(`Removed @${collaboratorLogin} from collaborators.`);
    } catch (err) {
      setRemoveApiError(
        formatCollaboratorError(err, "Unable to remove collaborator.")
      );
    }
  }

  const isOnlyCurrentUser =
    collaborators &&
    collaborators.length === 1 &&
    currentUser &&
    collaborators[0].login.toLowerCase() === currentUser.toLowerCase();

  const isOnlyRepoOwner =
    collaborators &&
    collaborators.length === 1 &&
    owner &&
    collaborators[0].login.toLowerCase() === owner.toLowerCase();

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-300">
            <Users size={14} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400">
              Repository Access
            </p>
            <h3 className="text-xs font-semibold text-white">
              Manage Collaborators
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close repository access"
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Repository Selection */}
      <div>
        <label
          htmlFor="collaborator-repo-select"
          className="mb-1 block text-[11px] text-zinc-400"
        >
          Repository
        </label>
        <select
          id="collaborator-repo-select"
          value={selectedRepoKey}
          onChange={(e) => handleSelectRepo(e.target.value)}
          disabled={isLoadingRepos}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none transition focus:border-zinc-600 disabled:opacity-50"
        >
          <option value="">Select repository</option>
          {repositories?.map((r) => (
            <option key={r.id} value={`${r.owner.login}/${r.name}`}>
              {r.name} {r.private ? "(Private)" : "(Public)"}
            </option>
          ))}
        </select>
      </div>

      {/* Global Success Banner */}
      {successMessage && (
        <div className="flex items-center justify-between rounded border border-emerald-900/50 bg-emerald-950/30 px-2.5 py-1.5 text-[11px] text-emerald-300">
          <div className="flex items-center gap-1.5">
            <Check size={12} className="shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Remove API Error */}
      {removeApiError && (
        <div className="flex items-center justify-between rounded border border-red-900/50 bg-red-950/30 px-2.5 py-1.5 text-[11px] text-red-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0 text-red-400" />
            <span>{removeApiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRemoveApiError(null)}
            className="text-red-400 hover:text-red-200"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Prompt to select repository if none selected */}
      {!selectedRepoKey && (
        <p className="py-2 text-center text-xs text-zinc-500">
          Select a repository to view and manage its collaborators.
        </p>
      )}

      {/* Collaborators section if repository selected */}
      {selectedRepoKey && (
        <div className="space-y-2 pt-1">
          {/* Action Subheader */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400">
              Collaborators{" "}
              {collaborators ? `(${collaborators.length})` : ""}
            </span>

            {!isAdding && (
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setAddValidationError(null);
                  setAddApiError(null);
                }}
                className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
              >
                <UserPlus size={11} />
                <span>Add Collaborator</span>
              </button>
            )}
          </div>

          {/* Add Collaborator Form */}
          {isAdding && (
            <form
              onSubmit={handleAddSubmit}
              className="space-y-2 rounded-md border border-zinc-800 bg-zinc-950 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white">
                  Add Collaborator
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>

              {(addValidationError || addApiError) && (
                <p className="rounded border border-red-900/50 bg-red-950/30 p-1.5 text-[10px] text-red-300">
                  {addValidationError || addApiError}
                </p>
              )}

              <div>
                <label
                  htmlFor="collab-username"
                  className="mb-1 block text-[10px] text-zinc-400"
                >
                  GitHub username <span className="text-red-400">*</span>
                </label>
                <input
                  id="collab-username"
                  type="text"
                  placeholder="e.g., octocat"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (addValidationError) setAddValidationError(null);
                  }}
                  disabled={addMutation.isPending}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="collab-permission"
                  className="mb-1 block text-[10px] text-zinc-400"
                >
                  Permission
                </label>
                <select
                  id="collab-permission"
                  value={permission}
                  onChange={(e) =>
                    setPermission(e.target.value as CollaboratorPermission)
                  }
                  disabled={addMutation.isPending}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white outline-none focus:border-zinc-600 disabled:opacity-50"
                >
                  <option value="pull">Read (pull)</option>
                  <option value="triage">Triage (triage)</option>
                  <option value="push">Write (push) - Default</option>
                  <option value="maintain">Maintain (maintain)</option>
                  <option value="admin">Admin (admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  disabled={addMutation.isPending}
                  className="rounded border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="rounded bg-white px-2.5 py-1 text-[11px] font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {addMutation.isPending ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          )}

          {/* Loading state */}
          {isLoadingCollaborators && (
            <div className="py-4 text-center text-xs text-zinc-500">
              Loading collaborators...
            </div>
          )}

          {/* Error state */}
          {isCollaboratorsError && !isLoadingCollaborators && (
            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3 text-center">
              <p className="text-xs text-red-400">
                {formatCollaboratorError(
                  collaboratorsError,
                  "Failed to load collaborators."
                )}
              </p>
            </div>
          )}

          {/* Empty state: 0 collaborators */}
          {!isLoadingCollaborators &&
            !isCollaboratorsError &&
            collaborators &&
            collaborators.length === 0 && (
              <div className="py-4 text-center text-xs text-zinc-500">
                No collaborators.
              </div>
            )}

          {/* Only user / repo owner note */}
          {!isLoadingCollaborators &&
            !isCollaboratorsError &&
            (isOnlyCurrentUser || isOnlyRepoOwner) && (
              <div className="rounded border border-zinc-800/80 bg-zinc-950/40 p-2 text-center text-[11px] text-zinc-400">
                You are the only collaborator.
              </div>
            )}

          {/* Collaborator items */}
          {!isLoadingCollaborators &&
            !isCollaboratorsError &&
            collaborators &&
            collaborators.length > 0 && (
              <div className="space-y-1.5">
                {collaborators.map((collab) => {
                  const isOwner =
                    owner &&
                    collab.login.toLowerCase() === owner.toLowerCase();
                  const isCurrent =
                    currentUser &&
                    collab.login.toLowerCase() === currentUser.toLowerCase();
                  const isConfirming = confirmRemovingUser === collab.login;
                  const isRemovingThis =
                    removeMutation.isPending &&
                    removeMutation.variables?.username === collab.login;

                  return (
                    <div
                      key={collab.id}
                      className="rounded-md border border-zinc-800 bg-zinc-950/70 p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* User avatar & info */}
                        <div className="flex min-w-0 items-center gap-2">
                          <img
                            src={collab.avatar_url}
                            alt={collab.login}
                            className="h-6 w-6 shrink-0 rounded-full border border-zinc-800 bg-zinc-900"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-medium text-white">
                                {collab.login}
                              </span>
                              {collab.html_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    chrome.tabs.create({
                                      url: collab.html_url,
                                    })
                                  }
                                  title="Open profile on GitHub"
                                  className="text-zinc-500 transition hover:text-zinc-300"
                                >
                                  <ExternalLink size={10} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400">
                                {getCollaboratorPermissionLabel(collab)}
                              </span>
                              {isOwner && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-zinc-800 px-1 py-0.2 text-[9px] text-zinc-400">
                                  <Shield size={9} />
                                  Owner
                                </span>
                              )}
                              {!isOwner && isCurrent && (
                                <span className="rounded bg-zinc-800 px-1 py-0.2 text-[9px] text-zinc-400">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (only if not owner) */}
                        {!isOwner && !isConfirming && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmRemovingUser(collab.login)
                            }
                            className="flex items-center gap-1 rounded border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400 transition hover:border-red-900/60 hover:bg-red-950/30 hover:text-red-400"
                          >
                            <Trash2 size={10} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Inline confirmation for removal */}
                      {!isOwner && isConfirming && (
                        <div className="mt-2 flex items-center justify-between rounded border border-red-900/40 bg-red-950/20 px-2 py-1.5 text-[11px]">
                          <span className="text-zinc-300">
                            Remove{" "}
                            <span className="font-semibold text-white">
                              {collab.login}
                            </span>
                            ?
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConfirmRemovingUser(null)}
                              disabled={isRemovingThis}
                              className="rounded border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmRemove(collab.login)}
                              disabled={isRemovingThis}
                              className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                              {isRemovingThis ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
