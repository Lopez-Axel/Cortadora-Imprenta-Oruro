import Decimal from "decimal.js"
import {
  CuttingStrategy, Sheet, Piece, Placement, LayoutResult,
  FreeRect, CuttingSettings, defaultSettings,
} from "@/lib/models/types"

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

function makeResult(strategy: string, placements: Placement[], sheet: Sheet): LayoutResult {
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

function tryColumnSplit(sheet: Sheet, pw: Decimal, ph: Decimal, pieceId: string): Placement[] {
  const sW = sheet.width.toNumber(), sH = sheet.height.toNumber()
  const pwN = pw.toNumber(), phN = ph.toNumber()

  let best: Placement[] = []
  let bestCount = 0

  const maxRotCols = Math.floor(sW / phN)

  for (let k = 0; k <= maxRotCols; k++) {
    const rotW = k * phN
    const remaining = sW - rotW
    const origCols = Math.floor(remaining / pwN)
    const rotPerCol = Math.floor(sH / pwN)
    const origPerCol = Math.floor(sH / phN)

    const totalCount = k * rotPerCol + origCols * origPerCol
    if (totalCount <= bestCount) continue

    const placements: Placement[] = []

    for (let c = 0; c < k; c++) {
      const x = new Decimal(c).mul(ph)
      for (let r = 0; r < rotPerCol; r++) {
        placements.push({
          pieceId,
          x,
          y: new Decimal(r).mul(pw),
          width: ph, height: pw,
          rotated: true,
        })
      }
    }

    for (let c = 0; c < origCols; c++) {
      const x = new Decimal(rotW + c * pwN)
      for (let r = 0; r < origPerCol; r++) {
        placements.push({
          pieceId,
          x,
          y: new Decimal(r).mul(ph),
          width: pw, height: ph,
          rotated: false,
        })
      }
    }

    best = placements
    bestCount = totalCount
  }

  return best
}

function tryRowSplit(sheet: Sheet, pw: Decimal, ph: Decimal, pieceId: string): Placement[] {
  const sW = sheet.width.toNumber(), sH = sheet.height.toNumber()
  const pwN = pw.toNumber(), phN = ph.toNumber()

  let best: Placement[] = []
  let bestCount = 0

  const maxRotRows = Math.floor(sH / pwN)

  for (let k = 0; k <= maxRotRows; k++) {
    const rotH = k * pwN
    const remaining = sH - rotH
    const origRows = Math.floor(remaining / phN)
    const rotPerRow = Math.floor(sW / phN)
    const origPerRow = Math.floor(sW / pwN)

    const totalCount = k * rotPerRow + origRows * origPerRow
    if (totalCount <= bestCount) continue

    const placements: Placement[] = []

    for (let r = 0; r < k; r++) {
      const y = new Decimal(r).mul(pw)
      for (let c = 0; c < rotPerRow; c++) {
        placements.push({
          pieceId,
          x: new Decimal(c).mul(ph),
          y,
          width: ph, height: pw,
          rotated: true,
        })
      }
    }

    for (let r = 0; r < origRows; r++) {
      const y = new Decimal(rotH + r * phN)
      for (let c = 0; c < origPerRow; c++) {
        placements.push({
          pieceId,
          x: new Decimal(c).mul(pw),
          y,
          width: pw, height: ph,
          rotated: false,
        })
      }
    }

    best = placements
    bestCount = totalCount
  }

  return best
}

function tryFreeRect(sheet: Sheet, pw: Decimal, ph: Decimal, allowRotation: boolean, pieceId: string): Placement[] {
  const placements: Placement[] = []
  let free: FreeRect[] = [{ x: new Decimal(0), y: new Decimal(0), width: sheet.width, height: sheet.height }]

  while (true) {
    let bestIdx = -1
    let bestFit: { x: Decimal; y: Decimal; w: Decimal; h: Decimal; rot: boolean } | null = null
    let bestScore: Decimal | null = null

    for (let i = 0; i < free.length; i++) {
      const r = free[i]
      const tries: { w: Decimal; h: Decimal; rot: boolean }[] = [{ w: pw, h: ph, rot: false }]
      if (allowRotation) {
        tries.push({ w: ph, h: pw, rot: true })
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

export class MixedStrategy implements CuttingStrategy {
  name = "Mixta"

  execute(sheet: Sheet, pieces: Piece[], _settings: CuttingSettings = defaultSettings): LayoutResult {
    void _settings

    if (pieces.length === 0) {
      return makeResult(this.name, [], sheet)
    }

    if (pieces.length === 1) {
      const p = pieces[0]
      if (!p.allowRotation) {
        const cols = sheet.width.div(p.width).floor().toNumber()
        const rows = sheet.height.div(p.height).floor().toNumber()
        const placements: Placement[] = []
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            placements.push({
              pieceId: p.id,
              x: new Decimal(c).mul(p.width),
              y: new Decimal(r).mul(p.height),
              width: p.width, height: p.height,
              rotated: false,
            })
          }
        }
        return makeResult(this.name, placements, sheet)
      }

      const candidates: Placement[][] = []

      candidates.push(tryColumnSplit(sheet, p.width, p.height, p.id))
      candidates.push(tryRowSplit(sheet, p.width, p.height, p.id))
      candidates.push(tryFreeRect(sheet, p.width, p.height, true, p.id))

      candidates.sort((a, b) => b.length - a.length)

      const best = candidates[0] ?? []
      return makeResult(this.name, best, sheet)
    }

    const expanded: Piece[] = []
    for (const p of pieces) {
      const qty = p.quantity ?? 1
      for (let i = 0; i < qty; i++) {
        expanded.push(p)
      }
    }

    expanded.sort((a, b) => b.width.mul(b.height).cmp(a.width.mul(a.height)))

    let free: FreeRect[] = [{ x: new Decimal(0), y: new Decimal(0), width: sheet.width, height: sheet.height }]
    const placements: Placement[] = []
    const priceMap = new Map<string, number>()

    for (const piece of expanded) {
      let bestIdx = -1
      let bestFit: { x: Decimal; y: Decimal; w: Decimal; h: Decimal; rot: boolean } | null = null
      let bestScore: Decimal | null = null

      for (let i = 0; i < free.length; i++) {
        const r = free[i]
        const tries: { w: Decimal; h: Decimal; rot: boolean }[] = [{ w: piece.width, h: piece.height, rot: false }]
        if (piece.allowRotation) {
          tries.push({ w: piece.height, h: piece.width, rot: true })
        }
        for (const t of tries) {
          if (t.w.lte(r.width) && t.h.lte(r.height)) {
            const score = r.width.mul(r.height).sub(t.w.mul(t.h))
            const id = `${piece.id}_${t.rot ? "r" : "n"}`
            const penalty = (priceMap.get(id) ?? 0) * 0.0001
            const finalScore = score.add(penalty)
            if (bestScore === null || finalScore.lt(bestScore)) {
              bestScore = finalScore
              bestIdx = i
              bestFit = { x: r.x, y: r.y, w: t.w, h: t.h, rot: t.rot }
            }
          }
        }
      }

      if (bestFit === null) continue

      const idKey = `${piece.id}_${bestFit.rot ? "r" : "n"}`
      priceMap.set(idKey, (priceMap.get(idKey) ?? 0) + 1)

      placements.push({
        pieceId: piece.id,
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

    return makeResult(this.name, placements, sheet)
  }
}
