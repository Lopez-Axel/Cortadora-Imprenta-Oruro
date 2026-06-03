import { CuttingDashboard } from "@/components/layouts/CuttingDashboard"

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <header className="border-b border-border bg-white px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Optimizador de Cortes
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Optimización y visualización de cortes para materiales rectangulares
        </p>
      </header>
      <CuttingDashboard />
    </main>
  )
}
