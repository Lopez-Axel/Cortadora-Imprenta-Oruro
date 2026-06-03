"use client"

import dynamic from "next/dynamic"
import { useCuttingEngine } from "@/lib/hooks/useCuttingEngine"
import { useCuttingStore } from "@/lib/store/cutting-store"
import { SheetForm } from "@/components/forms/SheetForm"
import { PieceForm } from "@/components/forms/PieceForm"
import { StrategyComparison } from "@/components/comparison/StrategyComparison"
import { MetricsCard } from "@/components/metrics/MetricsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { LayoutResult } from "@/lib/models/types"

const CuttingCanvas = dynamic(
  () => import("@/components/canvas/CuttingCanvas").then((m) => ({ default: m.CuttingCanvas })),
  { ssr: false }
)

function StrategyCard({
  result,
  totalRequested,
  isBest,
}: {
  result: LayoutResult
  totalRequested: number
  isBest: boolean
}) {
  return (
    <Card className={isBest ? "ring-2 ring-primary" : ""}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{result.strategy}</CardTitle>
        {isBest && (
          <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Mejor opción
          </span>
        )}
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-center bg-muted/30 rounded-lg p-2">
          <CuttingCanvas result={result} maxSize={260} compact />
        </div>
        <MetricsCard
          result={result}
          totalRequested={totalRequested}
          compact
        />
      </CardContent>
    </Card>
  )
}

export function CuttingDashboard() {
  const {
    pieces,
    allResults,
    bestResult,
    totalPiecesRequested,
  } = useCuttingEngine()

  const sheet = useCuttingStore((s) => s.sheet)
  const reset = useCuttingStore((s) => s.reset)

  const hasPieces = pieces.length > 0

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-6 flex-1">
      <div className="w-full lg:w-72 xl:w-80 space-y-4 shrink-0">
        <SheetForm />
        <PieceForm />

        {hasPieces && (
          <div className="space-y-3 pt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Pliego:</span>
                <span>{sheet.width.toString()}x{sheet.height.toString()}mm</span>
              </div>
              <div className="flex justify-between">
                <span>Piezas solicitadas:</span>
                <span>{totalPiecesRequested}</span>
              </div>
            </div>
            <Button
              onClick={reset}
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {!hasPieces && (
          <div className="flex items-center justify-center h-64 rounded-xl border bg-card text-muted-foreground text-sm">
            Agrega piezas para comenzar
          </div>
        )}

        {hasPieces && allResults.length > 0 && (
          <>
            <StrategyComparison
              results={allResults}
              totalRequested={totalPiecesRequested}
              bestResult={bestResult}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allResults.map((result) => (
                <StrategyCard
                  key={result.strategy}
                  result={result}
                  totalRequested={totalPiecesRequested}
                  isBest={bestResult !== null && result.strategy === bestResult.strategy}
                />
              ))}
            </div>

            {bestResult && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Vista general — {bestResult.strategy}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex justify-center">
                    <CuttingCanvas result={bestResult} maxSize={500} />
                  </div>
                </CardContent>
              </Card>
            )}

            {bestResult && (
              <MetricsCard
                result={bestResult}
                totalRequested={totalPiecesRequested}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
