import Decimal from "decimal.js"
import { CuttingStrategy, Sheet, Piece, Placement, LayoutResult, CuttingSettings, defaultSettings } from "@/lib/models/types"

export class HorizontalStrategy implements CuttingStrategy {
  name = "Horizontal"

  execute(sheet: Sheet, pieces: Piece[], _settings: CuttingSettings = defaultSettings): LayoutResult {
    void _settings
    const placements: Placement[] = []
    const expanded: Piece[] = []

    for (const p of pieces) {
      const qty = p.quantity ?? 1
      for (let i = 0; i < qty; i++) {
        expanded.push(p)
      }
    }

    expanded.sort((a, b) => b.width.mul(b.height).cmp(a.width.mul(a.height)))

    let currentY = new Decimal(0)
    let rowHeight = new Decimal(0)
    let currentX = new Decimal(0)

    for (const piece of expanded) {
      let pw = piece.width
      let ph = piece.height
      let rotated = false

      if (piece.allowRotation && ph.gt(pw) && ph.lte(sheet.width) && pw.lte(sheet.height)) {
        ;[pw, ph] = [ph, pw]
        rotated = true
      }

      if (pw.gt(sheet.width) || ph.gt(sheet.height)) continue

      if (currentX.add(pw).gt(sheet.width)) {
        currentX = new Decimal(0)
        currentY = currentY.add(rowHeight)
        rowHeight = new Decimal(0)
      }

      if (currentY.add(ph).gt(sheet.height)) continue

      placements.push({
        pieceId: piece.id,
        x: currentX,
        y: currentY,
        width: pw,
        height: ph,
        rotated,
      })

      currentX = currentX.add(pw)
      if (ph.gt(rowHeight)) rowHeight = ph
    }

    const totalArea = sheet.width.mul(sheet.height)
    const usedArea = placements.reduce((sum, p) => sum.add(p.width.mul(p.height)), new Decimal(0))

    return {
      strategy: this.name,
      placements,
      usedArea,
      wasteArea: totalArea.sub(usedArea),
      efficiency: totalArea.gt(0) ? usedArea.div(totalArea).mul(100) : new Decimal(0),
      totalPiecesPlaced: placements.length,
    }
  }
}
