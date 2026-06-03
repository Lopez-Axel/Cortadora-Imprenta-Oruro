"use client"

import { useMemo } from "react"
import { useCuttingStore } from "@/lib/store/cutting-store"
import { HorizontalStrategy } from "@/lib/algorithms/horizontal"
import { VerticalStrategy } from "@/lib/algorithms/vertical"
import { MixedStrategy } from "@/lib/algorithms/mixed"
import { MaxRectsStrategy } from "@/lib/algorithms/maxRects"
import { LayoutResult } from "@/lib/models/types"

export function useCuttingEngine() {
  const sheet = useCuttingStore((s) => s.sheet)
  const pieces = useCuttingStore((s) => s.pieces)
  const settings = useCuttingStore((s) => s.settings)

  const strategies = useMemo(
    () => ({
      Horizontal: new HorizontalStrategy(),
      Vertical: new VerticalStrategy(),
      Mixta: new MixedStrategy(),
      MaxRects: new MaxRectsStrategy(),
    }),
    []
  )

  const allResults = useMemo((): LayoutResult[] => {
    if (pieces.length === 0) return []
    const names: (keyof typeof strategies)[] = ["Horizontal", "Vertical", "Mixta", "MaxRects"]
    return names.map((name) => strategies[name].execute(sheet, pieces, settings))
  }, [sheet, pieces, settings, strategies])

  const bestResult = useMemo((): LayoutResult | null => {
    if (allResults.length === 0) return null
    return allResults.reduce((best, curr) => {
      const bestScore = best.totalPiecesPlaced * 1000 + best.efficiency.toNumber()
      const currScore = curr.totalPiecesPlaced * 1000 + curr.efficiency.toNumber()
      return currScore > bestScore ? curr : best
    })
  }, [allResults])

  const totalPiecesRequested = pieces.reduce((sum, p) => sum + (p.quantity ?? 1), 0)

  return {
    sheet,
    pieces,
    settings,
    allResults,
    bestResult,
    totalPiecesRequested,
  }
}
