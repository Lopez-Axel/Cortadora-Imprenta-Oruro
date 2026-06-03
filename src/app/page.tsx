import { CuttingDashboard } from "@/components/layouts/CuttingDashboard"

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <header className="px-6 lg:px-8 py-5 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Optimizador de Cortes
        </h1>
        <p className="text-sm text-blue-100 mt-0.5">
          Optimización y visualización de cortes para materiales rectangulares
        </p>
      </header>
      <CuttingDashboard />
    </main>
  )
}
