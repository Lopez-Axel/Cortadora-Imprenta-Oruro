"use client"

import { CandidateLayout } from "@/lib/models/types"
import { Target, CheckCircle, TrendingUp, Trash2 } from "lucide-react"

type DashboardMetricProps = {
  theoreticalMax: number
  bestCount: number
  efficiency: string
  waste: string
}

export function DashboardMetrics({
  theoreticalMax,
  bestCount,
  efficiency,
  waste,
}: DashboardMetricProps) {
  const gap = theoreticalMax - bestCount
  const maxReached = gap <= 0

  const cards = [
    {
      icon: Target,
      label: "Máximo teórico",
      value: theoreticalMax.toString(),
      sub: "piezas",
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      icon: CheckCircle,
      label: maxReached ? "Máximo alcanzado" : "Mejor encontrado",
      value: bestCount.toString(),
      sub: maxReached ? "¡Objetivo cumplido!" : `${gap} pieza(s) restante(s)`,
      color: maxReached ? "text-success-foreground" : "text-warning-foreground",
      bg: maxReached ? "bg-success" : "bg-warning",
    },
    {
      icon: TrendingUp,
      label: "Aprovechamiento",
      value: efficiency,
      sub: "del material",
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      icon: Trash2,
      label: "Desperdicio",
      value: waste,
      sub: "del material",
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border border-border ${c.bg} p-4 transition-all duration-200`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <c.icon className={`h-4 w-4 ${c.color}`} />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${c.color}`}>
            {c.value}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

type MetricsCardProps = {
  result: CandidateLayout
  totalRequested?: number
  compact?: boolean
}

export function MetricsCard({ result, totalRequested, compact = false }: MetricsCardProps) {
  const pending = totalRequested === undefined ? undefined : Math.max(0, totalRequested - result.totalPiecesPlaced)

  const totalArea = result.usedArea.add(result.wasteArea)

  if (compact) {
    return (
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aprov.</span>
          <span className="font-medium">{result.efficiency.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Desp.</span>
          <span className="font-medium">{result.wasteArea.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Colocadas</span>
          <span className="font-medium">{result.totalPiecesPlaced}{totalRequested !== undefined ? `/${totalRequested}` : ""}</span>
        </div>
      </div>
    )
  }

  const metrics = [
    { label: "Área Total", value: `${totalArea.toFixed(0)}` },
    { label: "Área Utilizada", value: `${result.usedArea.toFixed(0)}` },
    { label: "Área Desperdiciada", value: `${result.wasteArea.toFixed(0)}` },
    { label: "Aprovechamiento", value: `${result.efficiency.toFixed(1)}%` },
    { label: "Solicitadas", value: totalRequested !== undefined ? totalRequested.toString() : "—" },
    { label: "Producidas", value: result.totalPiecesPlaced.toString() },
    { label: "Faltantes", value: pending !== undefined ? pending.toString() : "—" },
  ]

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col rounded-lg bg-muted/50 p-2.5"
          >
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            <span className="text-sm font-semibold tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
