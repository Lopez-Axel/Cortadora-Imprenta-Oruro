"use client"

import { useState, useCallback, useRef, useLayoutEffect } from "react"
import { useCuttingEngine } from "@/lib/hooks/useCuttingEngine"
import { useCuttingStore } from "@/lib/store/cutting-store"
import { SheetForm } from "@/components/forms/SheetForm"
import { PieceForm } from "@/components/forms/PieceForm"
import { StrategyComparison } from "@/components/comparison/StrategyComparison"
import { DashboardMetrics } from "@/components/metrics/MetricsCard"
import { Button } from "@/components/ui/button"
import {
  RotateCcw, Bug, Maximize2, Minimize2, Download, Share2,
  AlertTriangle, Ruler, Info, Settings, ChevronDown,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CuttingCanvas } from "@/components/canvas/CuttingCanvas"

function CanvasSection({
  result,
  bestResult,
  sheet,
  showDebug,
  setShowDebug,
  setFullscreen,
  canvasRef,
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
  canvasRef: import("react").RefObject<HTMLCanvasElement | null>
  handleExport: () => void
  handleShare: () => void
  maximized?: boolean
}) {
  const isViewingBest = result?.strategy === bestResult?.strategy
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const canvasMaxSize = maximized ? 900 : (containerWidth > 0 ? containerWidth : 500)

  return (
    <div className={`relative rounded-xl overflow-hidden bg-white border border-slate-200 shadow-lg ${
      maximized ? "w-full h-full" : "w-full"
    }`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50`}>
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

      <div
        ref={containerRef}
        className={`flex items-center justify-center bg-[#F8FAFC] overflow-x-auto overflow-y-hidden ${maximized ? "h-[calc(100%-40px)]" : "w-full min-h-[350px] max-h-[500px] lg:min-h-[500px] lg:max-h-none"}`}
      >
        {result && result.placements.length > 0 ? (
          <CuttingCanvas
            result={result}
            sheetWidth={sheet.width}
            sheetHeight={sheet.height}
            maxSize={canvasMaxSize}
            showDebug={showDebug}
            canvasRef={canvasRef}
          />
        ) : (
          <div className="text-sm text-muted-foreground">Sin resultados</div>
        )}
      </div>

      {!maximized && result && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            {result.strategy} &middot; {result.totalPiecesPlaced} piezas &middot;{" "}
            {result.efficiency.toFixed(1)}% aprovechamiento
          </p>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="sm" className="h-7 max-lg:min-h-11 gap-1 text-xs" onClick={handleExport} />}
              >
                <Download className="h-3.5 w-3.5" /> PNG
              </TooltipTrigger>
              <TooltipContent side="top">Descargar imagen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="sm" className="h-7 max-lg:min-h-11 gap-1 text-xs" onClick={handleShare} />}
              >
                <Share2 className="h-3.5 w-3.5" /> Compartir
              </TooltipTrigger>
              <TooltipContent side="top">Compartir resultado</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {!isViewingBest && result && !maximized && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
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
  const setCalculated = useCuttingStore((s) => s.setCalculated)
  const reset = useCuttingStore((s) => s.reset)

  const [showDebug, setShowDebug] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null)
  const [lastCalculatedKey, setLastCalculatedKey] = useState<string | null>(null)

  const currentKey = `${sheet.width}_${sheet.height}_${pieces.map(p => `${p.id}_${p.width}_${p.height}_${p.quantity}`).join("|")}`
  const [fullscreen, setFullscreen] = useState(false)
  const [mobileFormOpen, setMobileFormOpen] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const activeResult = activeStrategy
    ? allResults.find((r) => r.strategy === activeStrategy) ?? null
    : bestResult

  const hasPieces = pieces.length > 0

  const totalArea = sheet.width.mul(sheet.height)
  const theoreticalMax = engineResult.theoreticalMax
  const bestCount = bestResult?.totalPiecesPlaced ?? 0

  const handleCalculate = () => {
    setCalculated(true)
    setLastCalculatedKey(currentKey)
  }

  const handleReset = () => {
    reset()
    setLastCalculatedKey(null)
  }

  const handleSelectStrategy = useCallback((strategy: string) => {
    setActiveStrategy((prev) => (prev === strategy ? null : strategy))
  }, [])

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `corte-${sheet.width}x${sheet.height}-${activeResult?.strategy ?? "mejor"}.png`
    link.href = dataUrl
    link.click()
  }, [sheet, activeResult, canvasRef])

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
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
    }, "image/png")
  }, [activeResult, handleExport])

  return (
    <>
      {/* Mobile: collapsible form section */}
      <div className="lg:hidden border-b border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setMobileFormOpen(!mobileFormOpen)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-slate-800 min-h-11"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            Configuración del corte
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${mobileFormOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileFormOpen && (
          <div className="px-4 pb-4 space-y-4">
            <SheetForm />
            <PieceForm />
            {pieces.length > 0 && sheet.width.gt(0) && sheet.height.gt(0) && (
              <Button
                onClick={handleCalculate}
                disabled={lastCalculatedKey === currentKey}
                className="w-full gap-2 min-h-11"
              >
                {lastCalculatedKey === null
                  ? "Calcular"
                  : lastCalculatedKey !== currentKey
                    ? "Recalcular"
                    : "Calculado"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1">
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-slate-200 bg-white">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <SheetForm />
            <PieceForm />

            {pieces.length > 0 && sheet.width.gt(0) && sheet.height.gt(0) && (
              <Button
                onClick={handleCalculate}
                disabled={lastCalculatedKey === currentKey}
                className="w-full gap-2 min-h-11"
              >
                {lastCalculatedKey === null
                  ? "Calcular"
                  : lastCalculatedKey !== currentKey
                    ? "Recalcular"
                    : "Calculado"}
              </Button>
            )}

            {hasPieces && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Material</span>
                    <span className="font-medium tabular-nums">{sheet.width.toString()} × {sheet.height.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Área</span>
                    <span className="font-medium tabular-nums">{totalArea.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solicitadas</span>
                    <span className="font-medium">{totalPiecesRequested ?? "Máximo posible"}</span>
                  </div>
                  {theoreticalMax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Máx. teórico</span>
                      <span className="font-medium tabular-nums">{theoreticalMax} piezas</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-slate-500 min-h-11"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reiniciar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-4 bg-[#F8FAFC]">
          {!hasPieces && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-2xl border-2 border-dashed border-slate-200 bg-white">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Ruler className="h-8 w-8 text-blue-300" />
              </div>
              <p className="text-lg font-medium text-slate-800">Ingresa las dimensiones para comenzar</p>
              <p className="text-sm text-slate-500 mt-1">
                Define el material y las piezas a optimizar
              </p>
            </div>
          )}

          {hasPieces && allResults.length > 0 && (
            <>
              {/* Mobile summary */}
              <div className="lg:hidden space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Material</span>
                    <span className="font-medium tabular-nums">{sheet.width.toString()} × {sheet.height.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Área</span>
                    <span className="font-medium tabular-nums">{totalArea.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solicitadas</span>
                    <span className="font-medium">{totalPiecesRequested ?? "Máximo posible"}</span>
                  </div>
                  {theoreticalMax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Máx. teórico</span>
                      <span className="font-medium tabular-nums">{theoreticalMax} piezas</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-slate-500 min-h-11"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reiniciar
                </Button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors min-h-11"
                >
                  <span>Ver detalles</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`} />
                </button>
                {showDetails && (
                  <div className="p-4">
                    <DashboardMetrics
                      theoreticalMax={theoreticalMax}
                      bestCount={bestCount}
                      efficiency={bestResult?.efficiency.toFixed(1) ?? "0"}
                      waste={`${bestResult?.wasteArea.toFixed(0) ?? "0"} (${(100 - (bestResult?.efficiency.toNumber() ?? 0)).toFixed(1)}%)`}
                    />
                  </div>
                )}
              </div>

              <CanvasSection
                result={activeResult}
                bestResult={bestResult}
                sheet={sheet}
                showDebug={showDebug}
                setShowDebug={setShowDebug}
                setFullscreen={setFullscreen}
                canvasRef={canvasRef}
                handleExport={handleExport}
                handleShare={handleShare}
              />

              <StrategyComparison
                results={allResults}
                bestResult={bestResult}
                activeStrategy={activeStrategy}
                onSelect={handleSelectStrategy}
              />

              <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                <Info className="h-3.5 w-3.5" />
                <span>Haz clic en una estrategia para verla en el canvas.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {fullscreen && activeResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]">
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-blue-200" />
                <span className="font-semibold text-white">{activeResult.strategy}</span>
                <span className="text-blue-200">
                  {sheet.width.toString()} × {sheet.height.toString()}
                </span>
                <span className="text-blue-200">&middot;</span>
                <span className="text-blue-200">{activeResult.totalPiecesPlaced} piezas</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 max-lg:min-h-11 gap-1 text-xs text-white hover:bg-white/20" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" /> PNG
                </Button>
                <Button variant="ghost" size="sm" className="h-7 max-lg:min-h-11 gap-1 text-xs text-white hover:bg-white/20" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" /> Compartir
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:bg-white/20" onClick={() => setFullscreen(false)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 bg-[#F8FAFC]">
              <CuttingCanvas
                result={activeResult}
                sheetWidth={sheet.width}
                sheetHeight={sheet.height}
                maxSize={900}
                showDebug={showDebug}
                canvasRef={canvasRef}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
