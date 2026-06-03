"use client"

import dynamic from "next/dynamic"
import type { Stage as StageType } from "konva/lib/Stage"
import { useState, useCallback, useRef } from "react"
import { useCuttingEngine } from "@/lib/hooks/useCuttingEngine"
import { useCuttingStore } from "@/lib/store/cutting-store"
import { SheetForm } from "@/components/forms/SheetForm"
import { PieceForm } from "@/components/forms/PieceForm"
import { StrategyComparison } from "@/components/comparison/StrategyComparison"
import { DashboardMetrics } from "@/components/metrics/MetricsCard"
import { Button } from "@/components/ui/button"
import {
  RotateCcw, Bug, Maximize2, Minimize2, Download, Share2,
  AlertTriangle, Ruler, Info,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const CuttingCanvas = dynamic(
  () => import("@/components/canvas/CuttingCanvas").then((m) => ({ default: m.CuttingCanvas })),
  { ssr: false }
)

function CanvasSection({
  result,
  bestResult,
  sheet,
  showDebug,
  setShowDebug,
  setFullscreen,
  stageRef,
  handleExport,
  handleShare,
  maximized = false,
}: {
  result: import("@/lib/models/types").CandidateLayout | null
  bestResult: import("@/lib/models/types").CandidateLayout | null
  sheet: import("@/lib/models/types").Sheet
  showDebug: boolean
  setShowDebug: (v: boolean) => void
  setFullscreen: (v: boolean) => void
  stageRef: import("react").MutableRefObject<StageType | null>
  handleExport: () => void
  handleShare: () => void
  maximized?: boolean
}) {
  const isViewingBest = result?.strategy === bestResult?.strategy

  return (
    <div className={`relative rounded-xl overflow-hidden bg-white border border-border ${
      maximized ? "w-full h-full" : "w-full"
    }`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30`}>
        <div className="flex items-center gap-2 text-sm">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{result?.strategy ?? "—"}</span>
          {!isViewingBest && result && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
              <AlertTriangle className="h-3 w-3" />
              No es la mejor opción
            </span>
          )}
          {isViewingBest && result && (
            <span className="inline-flex items-center rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
              Mejor opción
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDebug(!showDebug)} />}
            >
              <Bug className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Mostrar coordenadas</TooltipContent>
          </Tooltip>
          {!maximized && (
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFullscreen(true)} />}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Pantalla completa</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className={`flex items-center justify-center ${maximized ? "h-[calc(100%-40px)]" : "min-h-[400px] lg:min-h-[500px]"}`}>
        {result && result.placements.length > 0 ? (
          <CuttingCanvas
            result={result}
            sheetWidth={sheet.width}
            sheetHeight={sheet.height}
            maxSize={maximized ? 900 : 500}
            showDebug={showDebug}
            stageRef={stageRef}
          />
        ) : (
          <div className="text-sm text-muted-foreground">Sin resultados</div>
        )}
      </div>

      {!maximized && result && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {result.strategy} &middot; {result.totalPiecesPlaced} piezas &middot;{" "}
            {result.efficiency.toFixed(1)}% aprovechamiento
          </p>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExport} />}
              >
                <Download className="h-3.5 w-3.5" /> PNG
              </TooltipTrigger>
              <TooltipContent side="top">Descargar imagen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleShare} />}
              >
                <Share2 className="h-3.5 w-3.5" /> Compartir
              </TooltipTrigger>
              <TooltipContent side="top">Compartir resultado</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {!isViewingBest && result && !maximized && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-t border-warning/30 text-xs text-warning-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Esta solución tiene {result.efficiency.toFixed(1)}% de aprovechamiento.
            La mejor opción disponible es {bestResult?.efficiency.toFixed(1)}%.
          </span>
        </div>
      )}
    </div>
  )
}

export function CuttingDashboard() {
  const {
    pieces,
    allResults,
    bestResult,
    totalPiecesRequested,
    engineResult,
  } = useCuttingEngine()

  const sheet = useCuttingStore((s) => s.sheet)
  const reset = useCuttingStore((s) => s.reset)

  const [showDebug, setShowDebug] = useState(false)
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const stageRef = useRef<StageType | null>(null)

  const activeResult = activeStrategy
    ? allResults.find((r) => r.strategy === activeStrategy) ?? null
    : bestResult

  const hasPieces = pieces.length > 0

  const totalArea = sheet.width.mul(sheet.height)
  const theoreticalMax = engineResult.theoreticalMax
  const bestCount = bestResult?.totalPiecesPlaced ?? 0

  const handleSelectStrategy = useCallback((strategy: string) => {
    setActiveStrategy((prev) => (prev === strategy ? null : strategy))
  }, [])

  const handleExport = useCallback(async () => {
    const stage = stageRef.current
    if (!stage) return
    const dataUrl = stage.toDataURL({ pixelRatio: 2 })
    const link = document.createElement("a")
    link.download = `corte-${sheet.width}x${sheet.height}-${activeResult?.strategy ?? "mejor"}.png`
    link.href = dataUrl
    link.click()
  }, [sheet, activeResult])

  const handleShare = useCallback(async () => {
    const stage = stageRef.current
    if (!stage) return
    const dataUrl = stage.toDataURL({ pixelRatio: 2 })
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], `corte-${activeResult?.strategy ?? "mejor"}.png`, { type: "image/png" })
    if (navigator.share) {
      navigator.share({
        title: "Optimización de Corte",
        text: `${activeResult?.strategy}: ${activeResult?.totalPiecesPlaced} piezas, ${activeResult?.efficiency.toFixed(1)}% aprovechamiento`,
        files: [file],
      })
    } else {
      handleExport()
    }
  }, [activeResult, handleExport])

  return (
    <>
      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-border bg-white">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <SheetForm />
            <PieceForm />

            {hasPieces && (
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material</span>
                    <span className="font-medium tabular-nums">{sheet.width.toString()} × {sheet.height.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Área</span>
                    <span className="font-medium tabular-nums">{totalArea.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitadas</span>
                    <span className="font-medium">{totalPiecesRequested ?? "Máximo posible"}</span>
                  </div>
                  {theoreticalMax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Máx. teórico</span>
                      <span className="font-medium tabular-nums">{theoreticalMax} piezas</span>
                    </div>
                  )}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {!hasPieces && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-2xl border-2 border-dashed border-border bg-white">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                <Ruler className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-lg font-medium text-foreground">Ingresa las dimensiones para comenzar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Define el material y las piezas a optimizar
              </p>
            </div>
          )}

          {hasPieces && allResults.length > 0 && (
            <>
              <DashboardMetrics
                theoreticalMax={theoreticalMax}
                bestCount={bestCount}
                efficiency={bestResult?.efficiency.toFixed(1) ?? "0"}
                waste={`${bestResult?.wasteArea.toFixed(0) ?? "0"} (${(100 - (bestResult?.efficiency.toNumber() ?? 0)).toFixed(1)}%)`}
              />

              <div className="lg:hidden p-4 space-y-4 bg-white border-b border-border">
                <SheetForm />
                <PieceForm />
              </div>

              <StrategyComparison
                results={allResults}
                bestResult={bestResult}
                activeStrategy={activeStrategy}
                onSelect={handleSelectStrategy}
              />

              <CanvasSection
                result={activeResult}
                bestResult={bestResult}
                sheet={sheet}
                showDebug={showDebug}
                setShowDebug={setShowDebug}
                setFullscreen={setFullscreen}
                stageRef={stageRef}
                handleExport={handleExport}
                handleShare={handleShare}
              />

              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Info className="h-3.5 w-3.5" />
                <span>Haz clic en una estrategia para verla en el canvas. La mejor opción tiene borde verde.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {fullscreen && activeResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{activeResult.strategy}</span>
                <span className="text-muted-foreground">
                  {sheet.width.toString()} × {sheet.height.toString()}
                </span>
                <span className="text-muted-foreground">&middot;</span>
                <span className="text-muted-foreground">{activeResult.totalPiecesPlaced} piezas</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" /> PNG
                </Button>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" /> Compartir
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFullscreen(false)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <CuttingCanvas
                result={activeResult}
                sheetWidth={sheet.width}
                sheetHeight={sheet.height}
                maxSize={900}
                showDebug={showDebug}
                stageRef={stageRef}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
