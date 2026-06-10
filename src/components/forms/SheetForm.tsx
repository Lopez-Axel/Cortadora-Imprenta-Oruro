"use client"

import Decimal from "decimal.js"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCuttingStore } from "@/lib/store/cutting-store"

export function SheetForm() {
  const sheet = useCuttingStore((s) => s.sheet)
  const setSheet = useCuttingStore((s) => s.setSheet)

  const [width, setWidth] = useState(sheet.width.toNumber().toString())
  const [height, setHeight] = useState(sheet.height.toNumber().toString())

  const commit = (field: "width" | "height", raw: string) => {
    const val = parseFloat(raw)
    if (!raw || isNaN(val) || val <= 0) return
    setSheet({
      width: field === "width" ? new Decimal(val) : sheet.width,
      height: field === "height" ? new Decimal(val) : sheet.height,
    })
  }

  return (
    <Card key={`${sheet.width}-${sheet.height}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Material</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="width">Ancho</Label>
            <Input
              id="width"
              type="number"
              step="any"
              placeholder="Ej: 100"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              onBlur={(e) => commit("width", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height">Alto</Label>
            <Input
              id="height"
              type="number"
              step="any"
              placeholder="Ej: 100"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onBlur={(e) => commit("height", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
