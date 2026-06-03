import Decimal from "decimal.js"
import { create } from "zustand"
import { Sheet, Piece, CuttingSettings, defaultSettings } from "@/lib/models/types"

type CuttingState = {
  sheet: Sheet
  pieces: Piece[]
  settings: CuttingSettings
  editingPieceId: string | null
  setSheet: (sheet: Sheet) => void
  setPieces: (pieces: Piece[]) => void
  addPiece: (piece: Piece) => void
  removePiece: (id: string) => void
  updatePiece: (id: string, piece: Partial<Piece>) => void
  setEditingPieceId: (id: string | null) => void
  setSettings: (settings: CuttingSettings) => void
  reset: () => void
}

const defaultSheet: Sheet = { width: new Decimal(100), height: new Decimal(100) }

export const useCuttingStore = create<CuttingState>()((set) => ({
  sheet: defaultSheet,
  pieces: [],
  settings: defaultSettings,
  editingPieceId: null,

  setSheet: (sheet) => set({ sheet }),

  setPieces: (pieces) => set({ pieces }),

  addPiece: (piece) =>
    set((state) => ({ pieces: [...state.pieces, piece] })),

  removePiece: (id) =>
    set((state) => ({
      pieces: state.pieces.filter((p) => p.id !== id),
      editingPieceId: state.editingPieceId === id ? null : state.editingPieceId,
    })),

  updatePiece: (id, updates) =>
    set((state) => ({
      pieces: state.pieces.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  setEditingPieceId: (id) => set({ editingPieceId: id }),

  setSettings: (settings) => set({ settings }),

  reset: () =>
    set({
      sheet: defaultSheet,
      pieces: [],
      settings: defaultSettings,
      editingPieceId: null,
    }),
}))
