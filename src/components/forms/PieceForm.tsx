"use client"

import Decimal from "decimal.js"
import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { useCuttingStore } from "@/lib/store/cutting-store"
import { Piece } from "@/lib/models/types"
import { Pencil, X, Maximize2 } from "lucide-react"

type PieceFormValues = {
  width: number
  height: number
  quantity: number
  allowRotation: boolean
}

export function PieceForm() {
  const pieces = useCuttingStore((s) => s.pieces)
  const editingPieceId = useCuttingStore((s) => s.editingPieceId)
  const addPiece = useCuttingStore((s) => s.addPiece)
  const removePiece = useCuttingStore((s) => s.removePiece)
  const updatePiece = useCuttingStore((s) => s.updatePiece)
  const setEditingPieceId = useCuttingStore((s) => s.setEditingPieceId)

  const editingPiece = editingPieceId ? pieces.find((p) => p.id === editingPieceId) ?? null : null

  const canBeUnlimited = pieces.length <= 1
  const [maxMode, setMaxMode] = useState(canBeUnlimited)

  const pieceSchema = z.object({
    width: z.coerce.number().min(1, "Debe ser mayor a 0"),
    height: z.coerce.number().min(1, "Debe ser mayor a 0"),
    quantity: canBeUnlimited && maxMode
      ? z.coerce.number().optional().default(0)
      : z.coerce.number().min(1, "Debe ser mayor a 0"),
    allowRotation: z.boolean().default(true),
  })

  const resolver = zodResolver(pieceSchema) as Resolver<PieceFormValues>

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PieceFormValues>({
    resolver,
    defaultValues: {
      width: 0,
      height: 0,
      quantity: 0,
      allowRotation: true,
    },
  })

  const startEdit = (piece: Piece) => {
    const hasQty = piece.quantity !== undefined
    setEditingPieceId(piece.id)
    setMaxMode(!hasQty)
    setValue("width", piece.width.toNumber())
    setValue("height", piece.height.toNumber())
    setValue("quantity", piece.quantity ?? 0)
    setValue("allowRotation", piece.allowRotation)
  }

  const cancelEdit = () => {
    setEditingPieceId(null)
    reset()
  }

  const onSubmit = (data: PieceFormValues) => {
    const qty = (canBeUnlimited && maxMode) ? undefined : (data.quantity || undefined)
    if (editingPieceId && editingPiece) {
      updatePiece(editingPieceId, {
        width: new Decimal(data.width),
        height: new Decimal(data.height),
        quantity: qty,
        allowRotation: data.allowRotation,
      })
      setEditingPieceId(null)
    } else {
      addPiece({
        id: uuid(),
        width: new Decimal(data.width),
        height: new Decimal(data.height),
        quantity: qty,
        allowRotation: data.allowRotation,
      })
    }
    reset({ width: 0, height: 0, quantity: 0, allowRotation: true })
    if (canBeUnlimited) setMaxMode(true)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {editingPiece ? "Editar Pieza" : "Piezas"}
        </CardTitle>
        <CardDescription>
          {editingPiece
            ? `${editingPiece.width.toString()}×${editingPiece.height.toString()}`
            : "Agrega las piezas a cortar"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="piece-width">Ancho</Label>
              <Input
                id="piece-width"
                type="number"
                step="any"
                {...register("width")}
              />
              {errors.width && (
                <p className="text-xs text-destructive">{errors.width.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="piece-height">Alto</Label>
              <Input
                id="piece-height"
                type="number"
                step="any"
                {...register("height")}
              />
              {errors.height && (
                <p className="text-xs text-destructive">{errors.height.message}</p>
              )}
            </div>
          </div>

          {canBeUnlimited && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maxMode}
                onChange={() => {
                  setMaxMode(!maxMode)
                  if (!maxMode) setValue("quantity", 0)
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Buscar máximo aprovechamiento</span>
            </label>
          )}

          {(!canBeUnlimited || !maxMode) && (
            <div className="space-y-1.5">
              <Label htmlFor="piece-quantity">Cantidad</Label>
              <Input
                id="piece-quantity"
                type="number"
                min="1"
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                {...register("allowRotation")}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Rotación permitida
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="secondary" size="sm" className="flex-1">
              {editingPiece ? "Guardar" : "Agregar"}
            </Button>
            {editingPiece && (
              <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {pieces.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Piezas ({pieces.length})
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {pieces.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 transition-colors duration-200 ${
                    editingPieceId === p.id
                      ? "bg-primary/5 ring-1 ring-primary"
                      : "bg-muted hover:bg-accent"
                  }`}
                >
                  <span className="truncate flex-1 text-sm font-medium">
                    {p.width.toString()}×{p.height.toString()}
                    {p.quantity !== undefined ? ` ×${p.quantity}` : ""}
                    {p.allowRotation && (
                      <span className="text-muted-foreground ml-1 text-xs">⟳</span>
                    )}
                  </span>
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-muted-foreground hover:text-primary p-1 rounded transition-colors duration-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePiece(p.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors duration-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
