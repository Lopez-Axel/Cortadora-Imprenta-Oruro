"use client"

import { CandidateLayout } from "@/lib/models/types"
import { Target, CheckCircle, TrendingUp, Trash2 } from "lucide-react"

type DashboardMetricProps = {
  theoreticalMax: number
  bestCount: number
  efficiency: string
  waste: string
}

const cardStyles = [
  {
    icon: Target,
    label: "Máximo teórico",
    valueColor: "text-blue-600",
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    border: "border-blue-200",
  },
  {
    icon: CheckCircle,
    label: "Mejor encontrado",
    valueColor: "text-emerald-600",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    border: "border-emerald-200",
  },
  {
    icon: TrendingUp,
    label: "Aprovechamiento",
    valueColor: "text-emerald-700",
    bg: "bg-emerald-50/50",
    iconColor: "text-emerald-500",
    border: "border-emerald-200/50",
  },
  {
    icon: Trash2,
    label: "Desperdicio",
    valueColor: "text-amber-600",
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    border: "border-amber-200",
  },
]

export function DashboardMetrics({
  theoreticalMax,
  bestCount,
  efficiency,
  waste,
}: DashboardMetricProps) {
  const gap = theoreticalMax - bestCount
  const maxReached = gap <= 0

  const cards = cardStyles.map((c) => {
    if (c.label === "Mejor encontrado" && maxReached) {
      return {
        ...c,
        label: "Máximo alcanzado",
        value: bestCount.toString(),
        sub: "¡Objetivo cumplido!",
        valueColor: "text-emerald-600" as const,
        bg: "bg-emerald-50" as const,
        iconColor: "text-emerald-500" as const,
        border: "border-emerald-200" as const,
      }
    }

    const value = c.label === "Máximo teórico" ? theoreticalMax.toString()
      : c.label === "Mejor encontrado" ? bestCount.toString()
      : c.label === "Aprovechamiento" ? efficiency
      : waste

    const sub = c.label === "Máximo teórico" ? "piezas"
      : c.label === "Mejor encontrado" ? `${gap} pieza(s) restante(s)`
      : "del material"

    return { ...c, value, sub }
  })

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border ${c.bg} ${c.border} p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <c.icon className={`h-4 w-4 ${c.iconColor}`} />
            <span className="text-xs text-slate-500">{c.label}</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${c.valueColor}`}>
            {c.value}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col rounded-lg bg-slate-50 p-2.5"
          >
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{m.label}</span>
            <span className="text-sm font-semibold tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
