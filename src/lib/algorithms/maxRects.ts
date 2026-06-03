import Decimal from "decimal.js"
import { CuttingStrategy, Sheet, Piece, Placement, LayoutResult, FreeRect, CuttingSettings, defaultSettings } from "@/lib/models/types"

type Heuristic = "best-area-fit" | "best-short-side-fit"

type FitResult = {
  fit: boolean
  rotated: boolean
  x: Decimal
  y: Decimal
  width: Decimal
  height: Decimal
}

function tryFit(rect: FreeRect, pw: Decimal, ph: Decimal): FitResult | null {
  if (pw.lte(rect.width) && ph.lte(rect.height)) {
    return { fit: true, rotated: false, x: rect.x, y: rect.y, width: pw, height: ph }
  }
  return null
}

function tryFitRotated(rect: FreeRect, pw: Decimal, ph: Decimal): FitResult | null {
  if (ph.lte(rect.width) && pw.lte(rect.height)) {
    return { fit: true, rotated: true, x: rect.x, y: rect.y, width: ph, height: pw }
  }
  return null
}

function splitRect(
  placed: { x: Decimal; y: Decimal; width: Decimal; height: Decimal },
  free: FreeRect
): FreeRect[] {
  const result: FreeRect[] = []

  if (placed.x.lt(free.x.add(free.width)) && placed.x.add(placed.width).gt(free.x)) {
    if (placed.y.gt(free.y) && placed.y.lt(free.y.add(free.height))) {
      result.push({
        x: free.x,
        y: free.y,
        width: free.width,
        height: placed.y.sub(free.y),
      })
    }
    if (placed.y.add(placed.height).lt(free.y.add(free.height))) {
      result.push({
        x: free.x,
        y: placed.y.add(placed.height),
        width: free.width,
        height: free.y.add(free.height).sub(placed.y.add(placed.height)),
      })
    }
  }

  if (placed.y.lt(free.y.add(free.height)) && placed.y.add(placed.height).gt(free.y)) {
    if (placed.x.gt(free.x) && placed.x.lt(free.x.add(free.width))) {
      result.push({
        x: free.x,
        y: free.y,
        width: placed.x.sub(free.x),
        height: free.height,
      })
    }
    if (placed.x.add(placed.width).lt(free.x.add(free.width))) {
      result.push({
        x: placed.x.add(placed.width),
        y: free.y,
        width: free.x.add(free.width).sub(placed.x.add(placed.width)),
        height: free.height,
      })
    }
  }

  return result.filter((r) => r.width.gt(0) && r.height.gt(0))
}

function pruneFreeRects(freeRects: FreeRect[]): FreeRect[] {
  const pruned: FreeRect[] = []

  for (const r of freeRects) {
    let contained = false
    for (const other of freeRects) {
      if (other === r) continue
      if (
        other.x.lte(r.x) &&
        other.y.lte(r.y) &&
        other.x.add(other.width).gte(r.x.add(r.width)) &&
        other.y.add(other.height).gte(r.y.add(r.height))
      ) {
        contained = true
        break
      }
    }
    if (!contained) {
      pruned.push(r)
    }
  }

  return pruned
}

function heuristicScore(heuristic: Heuristic, freeRect: FreeRect, pw: Decimal, ph: Decimal): Decimal {
  if (heuristic === "best-area-fit") {
    return freeRect.width.mul(freeRect.height).sub(pw.mul(ph))
  }
  const shortSide = Decimal.min(freeRect.width.sub(pw), freeRect.height.sub(ph))
  return shortSide
}

export class MaxRectsStrategy implements CuttingStrategy {
  name = "MaxRects"
  private heuristic: Heuristic

  constructor(heuristic: Heuristic = "best-area-fit") {
    this.heuristic = heuristic
  }

  execute(sheet: Sheet, pieces: Piece[], _settings: CuttingSettings = defaultSettings): LayoutResult {
    void _settings
    const placements: Placement[] = []
    let freeRects: FreeRect[] = [
      { x: new Decimal(0), y: new Decimal(0), width: sheet.width, height: sheet.height },
    ]

    const expanded: Piece[] = []
    for (const p of pieces) {
      const qty = p.quantity ?? 1
      for (let i = 0; i < qty; i++) {
        expanded.push(p)
      }
    }

    expanded.sort((a, b) => {
      const aMax = Decimal.max(a.width, a.height)
      const bMax = Decimal.max(b.width, b.height)
      return bMax.cmp(aMax)
    })

    for (const piece of expanded) {
      let bestScore: Decimal | null = null
      let bestRectIndex = -1
      let bestFit: FitResult | null = null

      for (let i = 0; i < freeRects.length; i++) {
        const rect = freeRects[i]

        const fit1 = tryFit(rect, piece.width, piece.height)
        if (fit1) {
          const score = heuristicScore(this.heuristic, rect, piece.width, piece.height)
          if (bestScore === null || score.lt(bestScore)) {
            bestScore = score
            bestRectIndex = i
            bestFit = fit1
          }
        }

        if (piece.allowRotation) {
          const fit2 = tryFitRotated(rect, piece.width, piece.height)
          if (fit2) {
            const w = fit2.width
            const h = fit2.height
            const score = heuristicScore(this.heuristic, rect, w, h)
            if (bestScore === null || score.lt(bestScore)) {
              bestScore = score
              bestRectIndex = i
              bestFit = fit2
            }
          }
        }
      }

      if (bestFit === null || bestRectIndex === -1) continue

      const placed = bestFit
      placements.push({
        pieceId: piece.id,
        x: placed.x,
        y: placed.y,
        width: placed.width,
        height: placed.height,
        rotated: placed.rotated,
      })

      const newRects: FreeRect[] = []
      for (let i = 0; i < freeRects.length; i++) {
        if (i === bestRectIndex) {
          const splits = splitRect(placed, freeRects[i])
          newRects.push(...splits)
        } else {
          newRects.push(freeRects[i])
        }
      }

      freeRects = pruneFreeRects(newRects)
    }

    const totalArea = sheet.width.mul(sheet.height)
    const usedArea = placements.reduce((sum, p) => sum.add(p.width.mul(p.height)), new Decimal(0))

    return {
      strategy: `${this.name} (${this.heuristic})`,
      placements,
      usedArea,
      wasteArea: totalArea.sub(usedArea),
      efficiency: totalArea.gt(0) ? usedArea.div(totalArea).mul(100) : new Decimal(0),
      totalPiecesPlaced: placements.length,
    }
  }
}
