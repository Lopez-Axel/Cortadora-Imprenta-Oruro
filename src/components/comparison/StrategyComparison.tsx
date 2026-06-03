"use client"

import { CandidateLayout } from "@/lib/models/types"
import { ArrowUp, ArrowDown, Star } from "lucide-react"

type StrategyComparisonProps = {
  results: CandidateLayout[]
  bestResult: CandidateLayout | null
  activeStrategy: string | null
  onSelect: (strategy: string) => void
}

const STRATEGY_ICONS: Record<string, string> = {
  Mixta: "M",
  Horizontal: "→",
  Vertical: "↓",
  MaxRects: "▣",
}

export function StrategyComparison({
  results,
  bestResult,
  activeStrategy,
  onSelect,
}: StrategyComparisonProps) {
  if (results.length === 0) return null

  const top3 = results.slice(0, 3)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Estrategias
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((r) => {
          const isBest = bestResult !== null && r.strategy === bestResult.strategy
          const isActive = r.strategy === activeStrategy
          const pieces = r.totalPiecesPlaced
          const effFormatted = r.efficiency.toFixed(1)
          const wasteFormatted = r.wasteArea.toFixed(0)

          return (
            <button
              key={r.strategy}
              type="button"
              onClick={() => onSelect(r.strategy)}
              className={`text-left w-full rounded-xl border p-4 transition-all duration-200 card-hover ${
                isActive
                  ? isBest
                    ? "card-best border-success-foreground bg-success"
                    : "card-warning border-warning-foreground bg-warning"
                  : "bg-white border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {STRATEGY_ICONS[r.strategy] ?? "?"}
                  </span>
                  <span className="text-sm font-semibold">{r.strategy}</span>
                </div>
                {isBest && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                    <Star className="h-3 w-3" />
                    Mejor
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{pieces}</span>
                <span className="text-xs text-muted-foreground">piezas</span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-success-foreground" />
                  {effFormatted}%
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3 text-warning-foreground" />
                  {wasteFormatted}
                </span>
              </div>
            </button>
          )
        })}
      </div>
      {results.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          +{results.length - 3} estrategia(s) adicional(es)
        </p>
      )}
    </div>
  )
}
