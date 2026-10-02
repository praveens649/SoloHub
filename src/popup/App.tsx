import { useEffect, useState } from "react";
import { GitHubConnect } from "./components/GitHubConnect";
import { getAuth } from "../lib/storage/auth";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const auth = await getAuth();

      setAuthenticated(Boolean(auth));
      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[500px] w-[380px] bg-zinc-950 text-white p-4">
        Loading...
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-[500px] w-[380px] bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 px-4 py-3">
          <h1 className="text-lg font-semibold">
            Solohub
          </h1>

          <p className="text-xs text-zinc-400">
            GitHub Productivity
          </p>
        </header>

        <section className="p-4">
          <GitHubConnect />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[500px] w-[380px] bg-zinc-950 text-white p-4">
      <h1 className="text-lg font-semibold">
        Solohub Dashboard
      </h1>

      <p className="text-sm text-zinc-400 mt-1">
        GitHub connected shiiiiiii
      </p>
    </main>
  );
}

export default App;