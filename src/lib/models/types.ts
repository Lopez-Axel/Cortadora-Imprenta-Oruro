import Decimal from "decimal.js"

export type Sheet = {
  width: Decimal
  height: Decimal
}

export type Piece = {
  id: string
  width: Decimal
  height: Decimal
  quantity?: number
  allowRotation: boolean
}

export type Placement = {
  pieceId: string
  x: Decimal
  y: Decimal
  width: Decimal
  height: Decimal
  rotated: boolean
}

export type LayoutResult = {
  strategy: string
  placements: Placement[]
  usedArea: Decimal
  wasteArea: Decimal
  efficiency: Decimal
  totalPiecesPlaced: number
}

export type CuttingSettings = {
  gap: Decimal
  margin: Decimal
  bleed: Decimal
}

export interface CuttingStrategy {
  name: string
  execute(sheet: Sheet, pieces: Piece[], settings: CuttingSettings): LayoutResult
}

export type StrategyName = "Horizontal" | "Vertical" | "Mixta" | "MaxRects"

export type FreeRect = {
  x: Decimal
  y: Decimal
  width: Decimal
  height: Decimal
}

export const defaultSettings: CuttingSettings = {
  gap: new Decimal(0),
  margin: new Decimal(0),
  bleed: new Decimal(0),
}
