"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LayoutResult } from "@/lib/models/types"

type MetricsCardProps = {
  result: LayoutResult
  totalRequested: number
  compact?: boolean
}

export function MetricsCard({ result, totalRequested, compact = false }: MetricsCardProps) {
  const pending = Math.max(0, totalRequested - result.totalPiecesPlaced)

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
          <span className="font-medium">{result.wasteArea.toFixed(0)} mm²</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Colocadas</span>
          <span className="font-medium">{result.totalPiecesPlaced}/{totalRequested}</span>
        </div>
      </div>
    )
  }

  const metrics = [
    { label: "Área Total", value: `${totalArea.toFixed(0)} mm²` },
    { label: "Área Utilizada", value: `${result.usedArea.toFixed(0)} mm²` },
    { label: "Área Desperdiciada", value: `${result.wasteArea.toFixed(0)} mm²` },
    { label: "Aprovechamiento", value: `${result.efficiency.toFixed(1)}%` },
    { label: "Solicitadas", value: totalRequested.toString() },
    { label: "Producidas", value: result.totalPiecesPlaced.toString() },
    { label: "Faltantes", value: pending.toString() },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col rounded-lg border p-2"
            >
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
              <span className="text-sm font-semibold">{m.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
