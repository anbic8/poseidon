export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-5xl font-bold tracking-tight">Poseidon 🌊</h1>
      <p className="text-gray-500 text-lg">Schwimmtagebuch — Phase 1 läuft</p>
      <a
        href="/api/health"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
      >
        Health-Check
      </a>
    </main>
  )
}
