function App() {
  return (
    <main className="min-h-[500px] w-[380px] bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h1 className="text-lg font-semibold">
          Solohub
        </h1>

        <p className="text-xs text-zinc-400">
          A Productivity GitHub control center for solo developers.
        </p>
      </header>

      <section className="p-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">
            Extension initialized
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Ready to build.
          </h2>
        </div>
      </section>
    </main>
  );
}

export default App;