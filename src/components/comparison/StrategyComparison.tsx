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

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Estrategias ({results.length})
      </p>
      <div className="flex lg:block overflow-x-auto lg:overflow-visible gap-3 lg:space-y-2 pb-3 lg:pb-0 snap-x snap-mandatory scroll-pl-4 -mx-4 lg:mx-0 px-4 lg:px-0">
        {results.map((r, i) => {
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
              className={`text-left shrink-0 w-[75vw] lg:w-full snap-center rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-h-11 ${
                isBest
                  ? "bg-[#ECFDF5] border-[#22C55E] shadow-sm"
                  : isActive
                    ? "bg-white border-blue-500 shadow-md"
                    : "bg-white border-slate-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    isBest
                      ? "bg-[#22C55E] text-white"
                      : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}>
                    {STRATEGY_ICONS[r.strategy] ?? i + 1}
                  </span>
                  <span className="text-sm font-semibold">{r.strategy}</span>
                </div>
                {isBest && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#22C55E] px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Star className="h-3 w-3 fill-current" />
                    Mejor opción
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{pieces}</span>
                <span className="text-xs text-muted-foreground">piezas</span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-emerald-600" />
                  {effFormatted}%
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3 text-amber-500" />
                  {wasteFormatted}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
