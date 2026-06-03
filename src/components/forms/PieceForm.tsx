"use client"

import Decimal from "decimal.js"
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
import { Pencil, X } from "lucide-react"

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

  const isSingleType = pieces.length === 1

  const pieceSchema = z.object({
    width: z.coerce.number().min(1, "El ancho debe ser mayor a 0"),
    height: z.coerce.number().min(1, "El alto debe ser mayor a 0"),
    quantity: isSingleType
      ? z.coerce.number().min(0).optional().default(1)
      : z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
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
      quantity: 1,
      allowRotation: true,
    },
  })

  const startEdit = (piece: Piece) => {
    setEditingPieceId(piece.id)
    setValue("width", piece.width.toNumber())
    setValue("height", piece.height.toNumber())
    setValue("quantity", piece.quantity ?? 1)
    setValue("allowRotation", piece.allowRotation)
  }

  const cancelEdit = () => {
    setEditingPieceId(null)
    reset()
  }

  const onSubmit = (data: PieceFormValues) => {
    if (editingPieceId && editingPiece) {
      updatePiece(editingPieceId, {
        width: new Decimal(data.width),
        height: new Decimal(data.height),
        quantity: data.quantity || undefined,
        allowRotation: data.allowRotation,
      })
      setEditingPieceId(null)
    } else {
      const newPiece: Piece = {
        id: uuid(),
        width: new Decimal(data.width),
        height: new Decimal(data.height),
        quantity: isSingleType && data.quantity === 0 ? undefined : data.quantity || undefined,
        allowRotation: data.allowRotation,
      }
      addPiece(newPiece)
    }
    reset({ width: 0, height: 0, quantity: 1, allowRotation: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {editingPiece ? "Editar Pieza" : "Piezas"}
        </CardTitle>
        <CardDescription>
          {editingPiece
            ? `Editando ${editingPiece.width}x${editingPiece.height}mm`
            : "Agrega las piezas a cortar"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="piece-width">Ancho (mm)</Label>
              <Input
                id="piece-width"
                type="number"
                step="any"
                {...register("width")}
              />
              {errors.width && (
                <p className="text-sm text-destructive">{errors.width.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="piece-height">Alto (mm)</Label>
              <Input
                id="piece-height"
                type="number"
                step="any"
                {...register("height")}
              />
              {errors.height && (
                <p className="text-sm text-destructive">{errors.height.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="piece-quantity">
                Cantidad
                {isSingleType && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (opcional)
                  </span>
                )}
              </Label>
              <Input
                id="piece-quantity"
                type="number"
                min={isSingleType ? "0" : "1"}
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div className="space-y-2 flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  {...register("allowRotation")}
                  className="h-4 w-4"
                />
                Rotación
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1">
              {editingPiece ? "Guardar Cambios" : "Agregar Pieza"}
            </Button>
            {editingPiece && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {pieces.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">
              Piezas ({pieces.length})
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {pieces.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between text-sm rounded px-2 py-1 ${
                    editingPieceId === p.id ? "bg-primary/10 ring-1 ring-primary" : "bg-muted"
                  }`}
                >
                  <span className="truncate flex-1">
                    {p.width.toString()}x{p.height.toString()}mm
                    {p.quantity !== undefined ? ` x${p.quantity}` : ""}
                    {p.allowRotation && " ⟳"}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="text-muted-foreground hover:text-primary ml-1 shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePiece(p.id)}
                    className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
