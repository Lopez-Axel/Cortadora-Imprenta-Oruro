"use client"

import Decimal from "decimal.js"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCuttingStore } from "@/lib/store/cutting-store"

const sheetSchema = z.object({
  width: z.coerce.number().min(1, "El ancho debe ser mayor a 0"),
  height: z.coerce.number().min(1, "El alto debe ser mayor a 0"),
})

type SheetFormValues = {
  width: number
  height: number
}

const resolver = zodResolver(sheetSchema) as Resolver<SheetFormValues>

export function SheetForm() {
  const sheet = useCuttingStore((s) => s.sheet)
  const setSheet = useCuttingStore((s) => s.setSheet)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SheetFormValues>({
    resolver,
    defaultValues: { width: sheet.width.toNumber(), height: sheet.height.toNumber() },
  })

  const onSubmit = (data: SheetFormValues) => {
    setSheet({
      width: new Decimal(data.width),
      height: new Decimal(data.height),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pliego</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="width">Ancho (mm)</Label>
            <Input id="width" type="number" step="any" {...register("width")} />
            {errors.width && (
              <p className="text-sm text-destructive">{errors.width.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Alto (mm)</Label>
            <Input id="height" type="number" step="any" {...register("height")} />
            {errors.height && (
              <p className="text-sm text-destructive">{errors.height.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Aplicar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
