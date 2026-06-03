"use client"

import type { KonvaEventObject } from "konva/lib/Node"
import { useMemo, useRef, useState, useCallback } from "react"
import { Stage, Layer, Rect, Text, Group } from "react-konva"
import { LayoutResult } from "@/lib/models/types"
import Decimal from "decimal.js"

type CuttingCanvasProps = {
  result: LayoutResult
  maxSize?: number
  compact?: boolean
}

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
]

function getColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getSheetBounds(result: LayoutResult): { width: Decimal; height: Decimal } {
  let maxW = new Decimal(0)
  let maxH = new Decimal(0)
  for (const p of result.placements) {
    const right = p.x.add(p.width)
    const bottom = p.y.add(p.height)
    if (right.gt(maxW)) maxW = right
    if (bottom.gt(maxH)) maxH = bottom
  }
  if (maxW.eq(0)) maxW = new Decimal(1)
  if (maxH.eq(0)) maxH = new Decimal(1)
  return { width: maxW, height: maxH }
}

export function CuttingCanvas({
  result,
  maxSize = 260,
  compact = false,
}: CuttingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    text: string
  } | null>(null)

  const padding = compact ? 16 : 24

  const { width: sheetWidth, height: sheetHeight } = useMemo(
    () => getSheetBounds(result),
    [result]
  )

  const sW = sheetWidth.toNumber()
  const sH = sheetHeight.toNumber()

  const scale = useMemo(() => {
    if (sW === 0 || sH === 0) return 1
    const availableW = maxSize - padding * 2
    const availableH = maxSize - padding * 2
    return Math.min(availableW / sW, availableH / sH, 1)
  }, [sW, sH, maxSize, padding])

  const stageWidth = Math.max(sW * scale + padding * 2, 100)
  const stageHeight = Math.max(sH * scale + padding * 2, 100)

  const handleMouseEnter = useCallback(
    (e: KonvaEventObject<MouseEvent>, placement: {
      pieceId: string
      x: Decimal
      y: Decimal
      width: Decimal
      height: Decimal
      rotated: boolean
    }) => {
      const stage = e.target.getStage()
      const pos = stage?.getPointerPosition()
      if (!pos) return
      setTooltip({
        x: pos.x + 15,
        y: pos.y - 10,
        text: `${placement.width}x${placement.height}mm${placement.rotated ? " (rotada)" : ""}`,
      })
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  if (result.placements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        Sin resultados
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          <Rect
            x={padding}
            y={padding}
            width={sW * scale}
            height={sH * scale}
            stroke="#374151"
            strokeWidth={1}
            fill="#f8fafc"
          />
          {result.placements.map((placement, i) => {
            const color = getColor(placement.pieceId)
            const x = padding + placement.x.toNumber() * scale
            const y = padding + placement.y.toNumber() * scale
            const w = placement.width.toNumber() * scale
            const h = placement.height.toNumber() * scale
            const showLabel = !compact && w > 24 && h > 16

            return (
              <Group key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={Math.max(w, 0.5)}
                  height={Math.max(h, 0.5)}
                  fill={color}
                  stroke="#1e293b"
                  strokeWidth={0.5}
                  opacity={0.85}
                  onMouseEnter={(e) => handleMouseEnter(e, placement)}
                  onMouseLeave={handleMouseLeave}
                />
                {showLabel && (
                  <Text
                    x={x + 1}
                    y={y + 1}
                    text={`${placement.width}x${placement.height}`}
                    fontSize={Math.min(w, h) > 50 ? 9 : 7}
                    fill="#fff"
                    width={w - 2}
                    height={h - 2}
                    wrap="none"
                    ellipsis
                  />
                )}
                {placement.rotated && showLabel && (
                  <Text
                    x={x + 1}
                    y={y + (Math.min(w, h) > 50 ? 11 : 8)}
                    text="⟳"
                    fontSize={7}
                    fill="rgba(255,255,255,0.7)"
                  />
                )}
              </Group>
            )
          })}
          {tooltip && (
            <Group>
              <Rect
                x={tooltip.x}
                y={tooltip.y}
                width={tooltip.text.length * 5 + 12}
                height={18}
                fill="#1e293b"
                cornerRadius={3}
              />
              <Text
                x={tooltip.x + 6}
                y={tooltip.y + 3}
                text={tooltip.text}
                fontSize={10}
                fill="#fff"
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  )
}
