"use client"

import type { KonvaEventObject } from "konva/lib/Node"
import type { Stage as StageType } from "konva/lib/Stage"
import { useMemo, useState, useCallback } from "react"
import { Stage, Layer, Rect, Text, Group, Arrow } from "react-konva"
import { LayoutResult, FreeRect } from "@/lib/models/types"
import Decimal from "decimal.js"

type CuttingCanvasProps = {
  result: LayoutResult
  sheetWidth: Decimal
  sheetHeight: Decimal
  maxSize?: number
  compact?: boolean
  showDebug?: boolean
  stageRef?: React.RefObject<StageType | null>
}

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#be185d", "#059669", "#d97706", "#4f46e5", "#0891b2",
]

const CANVAS_PADDING = 60
const DIM_OFFSET = 22
const ORIGIN_SIZE = 14
const MIN_LABEL_W = 40
const MIN_LABEL_H = 20

function getColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function splitRect(
  placed: { x: Decimal; y: Decimal; width: Decimal; height: Decimal },
  free: FreeRect
): FreeRect[] {
  const result: FreeRect[] = []

  if (placed.x.lt(free.x.add(free.width)) && placed.x.add(placed.width).gt(free.x)) {
    if (placed.y.gt(free.y) && placed.y.lt(free.y.add(free.height))) {
      result.push({ x: free.x, y: free.y, width: free.width, height: placed.y.sub(free.y) })
    }
    if (placed.y.add(placed.height).lt(free.y.add(free.height))) {
      result.push({
        x: free.x,
        y: placed.y.add(placed.height),
        width: free.width,
        height: free.y.add(free.height).sub(placed.y.add(placed.height)),
      })
    }
  }

  if (placed.y.lt(free.y.add(free.height)) && placed.y.add(placed.height).gt(free.y)) {
    if (placed.x.gt(free.x) && placed.x.lt(free.x.add(free.width))) {
      result.push({ x: free.x, y: free.y, width: placed.x.sub(free.x), height: free.height })
    }
    if (placed.x.add(placed.width).lt(free.x.add(free.width))) {
      result.push({
        x: placed.x.add(placed.width),
        y: free.y,
        width: free.x.add(free.width).sub(placed.x.add(placed.width)),
        height: free.height,
      })
    }
  }

  return result.filter((r) => r.width.gt(0) && r.height.gt(0))
}

function computeFreeRects(sheetW: Decimal, sheetH: Decimal, placements: LayoutResult["placements"]): FreeRect[] {
  let freeRects: FreeRect[] = [{ x: new Decimal(0), y: new Decimal(0), width: sheetW, height: sheetH }]

  for (const p of placements) {
    const newRects: FreeRect[] = []
    for (const free of freeRects) {
      const overlapping =
        p.x.lt(free.x.add(free.width)) &&
        p.x.add(p.width).gt(free.x) &&
        p.y.lt(free.y.add(free.height)) &&
        p.y.add(p.height).gt(free.y)

      if (overlapping) {
        newRects.push(...splitRect(p, free))
      } else {
        newRects.push(free)
      }
    }
    freeRects = newRects
  }

  return freeRects.filter((r) => {
    const area = r.width.mul(r.height)
    return area.gt(0)
  })
}

export function CuttingCanvas({
  result,
  sheetWidth,
  sheetHeight,
  maxSize = 260,
  compact = false,
  showDebug = false,
  stageRef,
}: CuttingCanvasProps) {
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    text: string
  } | null>(null)

  const sW = sheetWidth.toNumber()
  const sH = sheetHeight.toNumber()
  const padding = CANVAS_PADDING

  const scale = useMemo(() => {
    if (sW === 0 || sH === 0) return 1
    const availableW = maxSize - padding * 2
    const availableH = maxSize - padding * 2
    return Math.min(availableW / sW, availableH / sH)
  }, [sW, sH, maxSize, padding])

  const stageWidth = Math.max(sW * scale + padding * 2, 120)
  const stageHeight = Math.max(sH * scale + padding * 2, 120)

  const validatedPlacements = useMemo(() => {
    const valid: (typeof result.placements)[0][] = []
    for (const p of result.placements) {
      const ok =
        p.x.gte(0) &&
        p.y.gte(0) &&
        p.x.add(p.width).lte(sheetWidth) &&
        p.y.add(p.height).lte(sheetHeight)
      if (ok) {
        valid.push(p)
      } else {
        console.warn(
          `Placement fuera del pliego: x=${p.x}, y=${p.y}, w=${p.width}, h=${p.height}, sheet=${sheetWidth}x${sheetHeight}`
        )
      }
    }
    return valid
  }, [result, sheetWidth, sheetHeight])

  const wasteRects = useMemo(() => {
    if (compact) return []
    return computeFreeRects(sheetWidth, sheetHeight, validatedPlacements)
  }, [sheetWidth, sheetHeight, validatedPlacements, compact])

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
        text: `${placement.width}x${placement.height}mm${placement.rotated ? " (rotada)" : ""} | x:${placement.x} y:${placement.y}`,
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

  const sheetX = padding
  const sheetY = padding
  const sheetW = sW * scale
  const sheetH = sH * scale

  return (
    <div className="relative overflow-hidden">
      <Stage
        width={stageWidth}
        height={stageHeight}
        ref={stageRef}
      >
        <Layer>
          {/* Gray background (outside sheet) */}
          <Rect
            x={0}
            y={0}
            width={stageWidth}
            height={stageHeight}
            fill="#e5e7eb"
          />

          {/* Sheet */}
          <Rect
            x={sheetX}
            y={sheetY}
            width={sheetW}
            height={sheetH}
            stroke="#000000"
            strokeWidth={2}
            fill="#ffffff"
          />

          {/* Waste areas */}
          {!compact && wasteRects.map((rect, i) => (
            <Rect
              key={`waste-${i}`}
              x={sheetX + rect.x.toNumber() * scale}
              y={sheetY + rect.y.toNumber() * scale}
              width={rect.width.toNumber() * scale}
              height={rect.height.toNumber() * scale}
              fill="#f5f5f5"
              stroke="#9ca3af"
              strokeWidth={1}
              dash={[4, 4]}
            />
          ))}

          {/* Placements */}
          {validatedPlacements.map((placement, i) => {
            const color = getColor(placement.pieceId)
            const x = sheetX + placement.x.toNumber() * scale
            const y = sheetY + placement.y.toNumber() * scale
            const w = placement.width.toNumber() * scale
            const h = placement.height.toNumber() * scale
            const showLabel = !compact && w >= MIN_LABEL_W && h >= MIN_LABEL_H

            return (
              <Group key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={Math.max(w, 0.5)}
                  height={Math.max(h, 0.5)}
                  fill={color}
                  stroke="#1e293b"
                  strokeWidth={1}
                  opacity={0.88}
                  onMouseEnter={(e) => handleMouseEnter(e, placement)}
                  onMouseLeave={handleMouseLeave}
                />
                {showLabel && (
                  <Text
                    x={x + 2}
                    y={y + 2}
                    text={`${placement.width}x${placement.height}`}
                    fontSize={Math.min(w, h) > 60 ? 10 : 8}
                    fill="#fff"
                    fontStyle="bold"
                    width={w - 4}
                    height={h - 4}
                    wrap="none"
                    ellipsis
                  />
                )}
                {placement.rotated && !compact && (
                  <>
                    <Rect
                      x={x}
                      y={y}
                      width={Math.max(w, 0.5)}
                      height={Math.max(h, 0.5)}
                      fill="#22c55e"
                      opacity={0.2}
                    />
                    <Text
                      x={x + 2}
                      y={y + (Math.min(w, h) > 60 ? 14 : 10)}
                      text="⟳"
                      fontSize={8}
                      fill="rgba(255,255,255,0.9)"
                    />
                  </>
                )}
                {showDebug && (
                  <Text
                    x={x + 2}
                    y={y + h - 16}
                    text={`x:${placement.x} y:${placement.y}`}
                    fontSize={7}
                    fill="rgba(255,255,255,0.9)"
                    fontStyle="bold"
                  />
                )}
              </Group>
            )
          })}

          {/* Dimension lines (not in compact mode) */}
          {!compact && (
            <>
              {/* Top dimension line */}
              <Arrow
                points={[sheetX, sheetY - DIM_OFFSET, sheetX + sheetW, sheetY - DIM_OFFSET]}
                pointerLength={5}
                pointerWidth={5}
                pointerAtBeginning={true}
                pointerAtEnding={true}
                stroke="#6b7280"
                fill="#6b7280"
                strokeWidth={1}
              />
              <Text
                x={sheetX + sheetW / 2}
                y={sheetY - DIM_OFFSET - 14}
                text={`${sheetWidth.toString()} mm`}
                align="center"
                verticalAlign="middle"
                fontSize={11}
                fill="#374151"
                offsetX={40}
              />

              {/* Left dimension line */}
              <Arrow
                points={[sheetX - DIM_OFFSET, sheetY, sheetX - DIM_OFFSET, sheetY + sheetH]}
                pointerLength={5}
                pointerWidth={5}
                pointerAtBeginning={true}
                pointerAtEnding={true}
                stroke="#6b7280"
                fill="#6b7280"
                strokeWidth={1}
              />
              <Text
                x={sheetX - DIM_OFFSET - 8}
                y={sheetY + sheetH / 2}
                text={`${sheetHeight.toString()} mm`}
                align="center"
                verticalAlign="middle"
                fontSize={11}
                fill="#374151"
                offsetY={6}
                rotation={-90}
              />

              {/* Origin marker */}
              <Text
                x={sheetX + 2}
                y={sheetY + 2}
                text="(0,0)"
                fontSize={9}
                fill="#6b7280"
                fontStyle="italic"
              />

              {/* X axis indicator */}
              <Arrow
                points={[sheetX + 4, sheetY + ORIGIN_SIZE + 4, sheetX + ORIGIN_SIZE + 8, sheetY + 4]}
                pointerLength={4}
                pointerWidth={4}
                stroke="#9ca3af"
                fill="#9ca3af"
                strokeWidth={1}
              />
              <Text x={sheetX + ORIGIN_SIZE + 10} y={sheetY + 1} text="X" fontSize={8} fill="#9ca3af" />

              {/* Y axis indicator */}
              <Arrow
                points={[sheetX + 4, sheetY + ORIGIN_SIZE + 4, sheetX + 4, sheetY + ORIGIN_SIZE + ORIGIN_SIZE + 4]}
                pointerLength={4}
                pointerWidth={4}
                stroke="#9ca3af"
                fill="#9ca3af"
                strokeWidth={1}
              />
              <Text x={sheetX + 6} y={sheetY + ORIGIN_SIZE + ORIGIN_SIZE + 4} text="Y" fontSize={8} fill="#9ca3af" />
            </>
          )}

          {/* Tooltip */}
          {tooltip && (
            <Group>
              <Rect
                x={tooltip.x}
                y={tooltip.y}
                width={tooltip.text.length * 5 + 14}
                height={20}
                fill="#1e293b"
                cornerRadius={4}
              />
              <Text
                x={tooltip.x + 7}
                y={tooltip.y + 4}
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
