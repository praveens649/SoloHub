import { useState } from "react";
import { loginWithGitHub } from "../../lib/github/auth";
import { getGitHubUser } from "../../lib/github/client";
import { setAuth } from "../../lib/storage/auth";
export function GitHubConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    try {
  setLoading(true);
  setError(null);

  

const token = await loginWithGitHub();

const user = await getGitHubUser(token);

await setAuth(token, user);

console.log("Authenticated:", user);

} catch (err) {
  console.error(err);

  setError(
    err instanceof Error
      ? err.message
      : "GitHub authentication failed"
  );
} finally {
  setLoading(false);
}
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect GitHub"}
      </button>

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}