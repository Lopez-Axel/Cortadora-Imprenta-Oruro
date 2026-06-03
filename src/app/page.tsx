import { CuttingDashboard } from "@/components/layouts/CuttingDashboard"

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <header className="border-b px-4 lg:px-6 py-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Optimizador Inteligente de Cortes
        </h1>
        <p className="text-sm text-muted-foreground">
          Optimización y visualización de cortes para materiales rectangulares
        </p>
      </header>
      <CuttingDashboard />
    </main>
  )
}
