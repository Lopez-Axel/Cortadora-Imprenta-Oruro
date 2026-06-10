import Decimal from "decimal.js"
import {
  Sheet, Piece, Placement, CandidateLayout, EngineResult,
  FreeRect, CuttingSettings, defaultSettings,
} from "@/lib/models/types"
import { HorizontalStrategy } from "./horizontal"
import { VerticalStrategy } from "./vertical"
import { MixedStrategy } from "./mixed"
import { MaxRectsStrategy } from "./maxRects"

function splitRect(
  placed: { x: Decimal; y: Decimal; width: Decimal; height: Decimal },
  free: FreeRect,
): FreeRect[] {
  const result: FreeRect[] = []
  if (placed.x.lt(free.x.add(free.width)) && placed.x.add(placed.width).gt(free.x)) {
    if (placed.y.gt(free.y) && placed.y.lt(free.y.add(free.height))) {
      result.push({ x: free.x, y: free.y, width: free.width, height: placed.y.sub(free.y) })
    }
    if (placed.y.add(placed.height).lt(free.y.add(free.height))) {
      result.push({
        x: free.x, y: placed.y.add(placed.height),
        width: free.width, height: free.y.add(free.height).sub(placed.y.add(placed.height)),
      })
    }
  }
  if (placed.y.lt(free.y.add(free.height)) && placed.y.add(placed.height).gt(free.y)) {
    if (placed.x.gt(free.x) && placed.x.lt(free.x.add(free.width))) {
      result.push({ x: free.x, y: free.y, width: placed.x.sub(free.x), height: free.height })
    }
    if (placed.x.add(placed.width).lt(free.x.add(free.width))) {
      result.push({
        x: placed.x.add(placed.width), y: free.y,
        width: free.x.add(free.width).sub(placed.x.add(placed.width)), height: free.height,
      })
    }
  }
  return result.filter((r) => r.width.gt(0) && r.height.gt(0))
}

function pruneRects(rects: FreeRect[]): FreeRect[] {
  const out: FreeRect[] = []
  for (const r of rects) {
    let contained = false
    for (const other of rects) {
      if (other === r) continue
      if (other.x.lte(r.x) && other.y.lte(r.y) &&
        other.x.add(other.width).gte(r.x.add(r.width)) &&
        other.y.add(other.height).gte(r.y.add(r.height))) {
        contained = true
        break
      }
    }
    if (!contained) out.push(r)
  }
  return out
}

function makeResult(strategy: string, placements: Placement[], sheet: Sheet): CandidateLayout {
  const totalArea = sheet.width.mul(sheet.height)
  const usedArea = placements.reduce((sum, p) => sum.add(p.width.mul(p.height)), new Decimal(0))
  return {
    strategy,
    placements,
    usedArea,
    wasteArea: totalArea.sub(usedArea),
    efficiency: totalArea.gt(0) ? usedArea.div(totalArea).mul(100) : new Decimal(0),
    totalPiecesPlaced: placements.length,
  }
}

function gridFromSize(sheetW: Decimal, sheetH: Decimal, pw: Decimal, ph: Decimal): { cols: number; rows: number } {
  return {
    cols: sheetW.div(pw).floor().toNumber(),
    rows: sheetH.div(ph).floor().toNumber(),
  }
}

function placeGrid(sheet: Sheet, pw: Decimal, ph: Decimal, rotated: boolean, pieceId: string): Placement[] {
  const { cols, rows } = gridFromSize(sheet.width, sheet.height, pw, ph)
  const placements: Placement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      placements.push({
        pieceId,
        x: new Decimal(c).mul(pw),
        y: new Decimal(r).mul(ph),
        width: pw,
        height: ph,
        rotated,
      })
    }
  }
  return placements
}

function packInRects(
  rects: FreeRect[],
  pw: Decimal, ph: Decimal,
  pwRot: Decimal, phRot: Decimal,
  allowRotation: boolean,
  pieceId: string,
): Placement[] {
  const placements: Placement[] = []
  let free = rects.map((r) => ({ ...r }))

  while (true) {
    let bestIdx = -1
    let bestFit: { x: Decimal; y: Decimal; w: Decimal; h: Decimal; rot: boolean } | null = null
    let bestScore: Decimal | null = null

    for (let i = 0; i < free.length; i++) {
      const r = free[i]
      const tries: { w: Decimal; h: Decimal; rot: boolean }[] = [{ w: pw, h: ph, rot: false }]
      if (allowRotation) {
        tries.push({ w: pwRot, h: phRot, rot: true })
      }
      for (const t of tries) {
        if (t.w.lte(r.width) && t.h.lte(r.height)) {
          const score = r.width.mul(r.height).sub(t.w.mul(t.h))
          if (bestScore === null || score.lt(bestScore)) {
            bestScore = score
            bestIdx = i
            bestFit = { x: r.x, y: r.y, w: t.w, h: t.h, rot: t.rot }
          }
        }
      }
    }

    if (bestFit === null) break

    placements.push({
      pieceId,
      x: bestFit.x,
      y: bestFit.y,
      width: bestFit.w,
      height: bestFit.h,
      rotated: bestFit.rot,
    })

    const newFree: FreeRect[] = []
      for (let i = 0; i < free.length; i++) {
        if (i === bestIdx && bestFit) {
          newFree.push(...splitRect({ x: bestFit.x, y: bestFit.y, width: bestFit.w, height: bestFit.h }, free[i]))
        } else {
          newFree.push(free[i])
        }
      }
    free = pruneRects(newFree)
  }

  return placements
}

function patternA(sheet: Sheet, p: Piece): CandidateLayout {
  const placements = placeGrid(sheet, p.width, p.height, false, p.id)
  return makeResult("Patrón A: Cuadrícula original", placements, sheet)
}

function patternB(sheet: Sheet, p: Piece): CandidateLayout {
  if (!p.allowRotation) return patternA(sheet, p)
  const placements = placeGrid(sheet, p.height, p.width, true, p.id)
  return makeResult("Patrón B: Cuadrícula rotada", placements, sheet)
}

function patternC(sheet: Sheet, p: Piece): CandidateLayout {
  const pw = p.width, ph = p.height
  const { cols, rows } = gridFromSize(sheet.width, sheet.height, pw, ph)
  const placements = placeGrid(sheet, pw, ph, false, p.id)

  const freeRects: FreeRect[] = []
  const rightX = new Decimal(cols).mul(pw)
  if (rightX.lt(sheet.width)) {
    freeRects.push({ x: rightX, y: new Decimal(0), width: sheet.width.sub(rightX), height: sheet.height })
  }
  const bottomY = new Decimal(rows).mul(ph)
  if (bottomY.lt(sheet.height)) {
    freeRects.push({ x: new Decimal(0), y: bottomY, width: rightX, height: sheet.height.sub(bottomY) })
  }

  if (freeRects.length > 0 && p.allowRotation) {
    const extra = packInRects(freeRects, pw, ph, ph, pw, true, p.id)
    placements.push(...extra)
  }

  return makeResult("Patrón C: Cuadrícula original + relleno", placements, sheet)
}

function patternD(sheet: Sheet, p: Piece): CandidateLayout {
  if (!p.allowRotation) return patternC(sheet, p)
  const pw = p.height, ph = p.width
  const { cols, rows } = gridFromSize(sheet.width, sheet.height, pw, ph)
  const placements = placeGrid(sheet, pw, ph, true, p.id)

  const freeRects: FreeRect[] = []
  const rightX = new Decimal(cols).mul(pw)
  if (rightX.lt(sheet.width)) {
    freeRects.push({ x: rightX, y: new Decimal(0), width: sheet.width.sub(rightX), height: sheet.height })
  }
  const bottomY = new Decimal(rows).mul(ph)
  if (bottomY.lt(sheet.height)) {
    freeRects.push({ x: new Decimal(0), y: bottomY, width: rightX, height: sheet.height.sub(bottomY) })
  }

  if (freeRects.length > 0) {
    const extra = packInRects(freeRects, p.width, p.height, p.height, p.width, true, p.id)
    placements.push(...extra)
  }

  return makeResult("Patrón D: Cuadrícula rotada + relleno", placements, sheet)
}

function patternE(sheet: Sheet, p: Piece): CandidateLayout {
  const pw = p.width, ph = p.height
  const stripW = pw
  const numStrips = sheet.width.div(stripW).floor().toNumber()
  const placements: Placement[] = []

  for (let s = 0; s < numStrips; s++) {
    const sx = new Decimal(s).mul(stripW)
    const stripFree: FreeRect[] = [{ x: sx, y: new Decimal(0), width: stripW, height: sheet.height }]
    const extra = packInRects(stripFree, pw, ph, ph, pw, p.allowRotation, p.id)
    placements.push(...extra)
  }

  return makeResult("Patrón E: Franjas verticales", placements, sheet)
}

function patternF(sheet: Sheet, p: Piece): CandidateLayout {
  const pw = p.width, ph = p.height
  const stripH = ph
  const numStrips = sheet.height.div(stripH).floor().toNumber()
  const placements: Placement[] = []

  for (let s = 0; s < numStrips; s++) {
    const sy = new Decimal(s).mul(stripH)
    const stripFree: FreeRect[] = [{ x: new Decimal(0), y: sy, width: sheet.width, height: stripH }]
    const extra = packInRects(stripFree, pw, ph, ph, pw, p.allowRotation, p.id)
    placements.push(...extra)
  }

  return makeResult("Patrón F: Franjas horizontales", placements, sheet)
}

export function computeTheoreticalMax(sheet: Sheet, pieces: Piece[]): number {
  if (pieces.length === 1 && pieces[0].quantity === undefined) {
    const p = pieces[0]
    const sheetArea = sheet.width.mul(sheet.height)
    const pieceArea = p.width.mul(p.height)
    return sheetArea.div(pieceArea).floor().toNumber()
  }
  return pieces.reduce((sum, p) => sum + (p.quantity ?? 1), 0)
}

export function generateLayouts(
  sheet: Sheet,
  pieces: Piece[],
  settings: CuttingSettings = defaultSettings,
): EngineResult {
  const theoreticalMax = computeTheoreticalMax(sheet, pieces)
  const candidates: CandidateLayout[] = []

  if (pieces.length === 0) return { theoreticalMax, candidates }

  const horiz = new HorizontalStrategy()
  const vert = new VerticalStrategy()
  const mix = new MixedStrategy()
  const maxR = new MaxRectsStrategy()

  candidates.push(horiz.execute(sheet, pieces, settings))
  candidates.push(vert.execute(sheet, pieces, settings))
  candidates.push(mix.execute(sheet, pieces, settings))
  candidates.push(maxR.execute(sheet, pieces, settings))

  if (pieces.length === 1) {
    const p = pieces[0]
    candidates.push(patternA(sheet, p))
    candidates.push(patternB(sheet, p))
    candidates.push(patternC(sheet, p))
    candidates.push(patternD(sheet, p))
    candidates.push(patternE(sheet, p))
    candidates.push(patternF(sheet, p))
  }

  const seen = new Set<string>()
  const deduped: CandidateLayout[] = []

  for (const c of candidates) {
    if (c.totalPiecesPlaced === 0) continue
    const key = c.placements.map((pl) => `${pl.x}_${pl.y}_${pl.width}_${pl.height}_${pl.rotated}`).join("|")
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(c)
  }

  deduped.sort((a, b) => {
    const effCmp = b.efficiency.cmp(a.efficiency)
    if (effCmp !== 0) return effCmp
    const wasteCmp = a.wasteArea.cmp(b.wasteArea)
    if (wasteCmp !== 0) return wasteCmp
    return b.totalPiecesPlaced - a.totalPiecesPlaced
  })

  function hasOverlap(placements: Placement[]): boolean {
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = placements[i]
        const b = placements[j]
        const overlapX = a.x.lt(b.x.add(b.width)) && a.x.add(a.width).gt(b.x)
        const overlapY = a.y.lt(b.y.add(b.height)) && a.y.add(a.height).gt(b.y)
        if (overlapX && overlapY) return true
      }
    }
    return false
  }

  const valid = deduped.filter((c) => !hasOverlap(c.placements))

  return { theoreticalMax, candidates: valid }
}

export function pickBest(candidates: CandidateLayout[]): CandidateLayout | null {
  if (candidates.length === 0) return null
  return candidates.reduce((best, curr) => {
    const bestScore = best.totalPiecesPlaced * 1000 + best.efficiency.toNumber()
    const currScore = curr.totalPiecesPlaced * 1000 + curr.efficiency.toNumber()
    return currScore > bestScore ? curr : best
  })
}
