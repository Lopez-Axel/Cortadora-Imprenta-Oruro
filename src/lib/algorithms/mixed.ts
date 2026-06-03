import { CuttingStrategy, Sheet, Piece, LayoutResult, CuttingSettings, defaultSettings } from "@/lib/models/types"
import { HorizontalStrategy } from "./horizontal"
import { VerticalStrategy } from "./vertical"

export class MixedStrategy implements CuttingStrategy {
  name = "Mixta"

  execute(sheet: Sheet, pieces: Piece[], settings: CuttingSettings = defaultSettings): LayoutResult {
    const horizontal = new HorizontalStrategy()
    const vertical = new VerticalStrategy()

    const hResult = horizontal.execute(sheet, pieces, settings)
    const vResult = vertical.execute(sheet, pieces, settings)

    const hScore = hResult.totalPiecesPlaced * 1000 + hResult.efficiency.toNumber()
    const vScore = vResult.totalPiecesPlaced * 1000 + vResult.efficiency.toNumber()

    if (hScore >= vScore) {
      return { ...hResult, strategy: this.name }
    }

    return { ...vResult, strategy: this.name }
  }
}
