"use client"

import { useMemo } from "react"
import { useCuttingStore } from "@/lib/store/cutting-store"
import { generateLayouts, pickBest } from "@/lib/algorithms/engine"
import { CandidateLayout, EngineResult } from "@/lib/models/types"

export function useCuttingEngine() {
  const sheet = useCuttingStore((s) => s.sheet)
  const pieces = useCuttingStore((s) => s.pieces)
  const settings = useCuttingStore((s) => s.settings)

  const engineResult = useMemo((): EngineResult => {
    if (pieces.length === 0) return { theoreticalMax: 0, candidates: [] }
    return generateLayouts(sheet, pieces, settings)
  }, [sheet, pieces, settings])

  const allResults = engineResult.candidates

  const bestResult = useMemo((): CandidateLayout | null => {
    return pickBest(allResults)
  }, [allResults])

  const hasUnlimitedPiece = pieces.length === 1 && pieces[0].quantity === undefined
  const totalPiecesRequested = hasUnlimitedPiece
    ? undefined
    : pieces.reduce((sum, p) => sum + (p.quantity ?? 1), 0)

  return {
    sheet,
    pieces,
    settings,
    allResults,
    bestResult,
    totalPiecesRequested,
    hasUnlimitedPiece,
    engineResult,
  }
}
