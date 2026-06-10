"use client"

import { useEffect, useRef } from "react"
import Decimal from "decimal.js"
import { LayoutResult } from "@/lib/models/types"

type CuttingCanvasProps = {
  result: LayoutResult
  sheetWidth: Decimal
  sheetHeight: Decimal
  maxSize?: number
  compact?: boolean
  showDebug?: boolean
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
}

const PADDING = 60
const DIM_OFFSET = 22

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
) {
  const headLen = 6
  const angle = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  for (const [ox, oy] of [[x1, y1], [x2, y2]]) {
    const dir = ox === x1 ? Math.PI : 0
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + headLen * Math.cos(angle + dir + 0.4), oy + headLen * Math.sin(angle + dir + 0.4))
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + headLen * Math.cos(angle + dir - 0.4), oy + headLen * Math.sin(angle + dir - 0.4))
    ctx.stroke()
  }
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  result: LayoutResult,
  sheetWidth: Decimal,
  sheetHeight: Decimal,
  maxSize: number,
  compact: boolean,
  showDebug: boolean,
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const sW = sheetWidth.toNumber()
  const sH = sheetHeight.toNumber()
  if (sW === 0 || sH === 0) return

  const available = maxSize - PADDING * 2
  const scale = Math.min(available / sW, available / sH)

  canvas.width = Math.max(sW * scale + PADDING * 2, 120)
  canvas.height = Math.max(sH * scale + PADDING * 2, 120)

  const ox = PADDING
  const oy = PADDING
  const sw = sW * scale
  const sh = sH * scale

  ctx.fillStyle = "#e5e7eb"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(ox, oy, sw, sh)
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 2
  ctx.strokeRect(ox, oy, sw, sh)

  for (const p of result.placements) {
    const x = ox + p.x.toNumber() * scale
    const y = oy + p.y.toNumber() * scale
    const w = Math.max(p.width.toNumber() * scale, 0.5)
    const h = Math.max(p.height.toNumber() * scale, 0.5)

    ctx.globalAlpha = 0.88
    ctx.fillStyle = "#B2FFFF"
    ctx.fillRect(x, y, w, h)
    ctx.globalAlpha = 1
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)

    if (!compact && w >= 40 && h >= 20) {
      ctx.fillStyle = "#1e293b"
      ctx.font = "bold 9px sans-serif"
      ctx.fillText(`${p.width}x${p.height}`, x + 3, y + 11)
    }

    if (showDebug) {
      ctx.fillStyle = "rgba(255,255,255,0.85)"
      ctx.font = "7px sans-serif"
      ctx.fillText(`x:${p.x} y:${p.y}`, x + 2, y + h - 4)
    }
  }

  if (compact) return

  ctx.strokeStyle = "#6b7280"
  ctx.fillStyle = "#374151"
  ctx.lineWidth = 1
  ctx.font = "11px sans-serif"

  drawArrow(ctx, ox, oy - DIM_OFFSET, ox + sw, oy - DIM_OFFSET)
  ctx.fillText(`${sheetWidth} mm`, ox + sw / 2 - 20, oy - DIM_OFFSET - 4)

  ctx.save()
  ctx.translate(ox - DIM_OFFSET, oy + sh / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(`${sheetHeight} mm`, -20, 0)
  ctx.restore()
  drawArrow(ctx, ox - DIM_OFFSET, oy, ox - DIM_OFFSET, oy + sh)

  ctx.fillStyle = "#6b7280"
  ctx.font = "italic 9px sans-serif"
  ctx.fillText("(0,0)", ox + 2, oy + 10)
}

export function CuttingCanvas({
  result,
  sheetWidth,
  sheetHeight,
  maxSize = 260,
  compact = false,
  showDebug = false,
  canvasRef: externalRef,
}: CuttingCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalRef ?? internalRef
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCanvas(canvas, result, sheetWidth, sheetHeight, maxSize, compact, showDebug)
  })

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const tooltip = tooltipRef.current
    if (!canvas || !tooltip) return

    const sW = sheetWidth.toNumber()
    const sH = sheetHeight.toNumber()
    const available = maxSize - PADDING * 2
    const scale = Math.min(available / sW, available / sH)

    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left - PADDING) / scale
    const my = (e.clientY - rect.top - PADDING) / scale

    let found = false
    for (const p of result.placements) {
      if (
        mx >= p.x.toNumber() && mx <= p.x.toNumber() + p.width.toNumber() &&
        my >= p.y.toNumber() && my <= p.y.toNumber() + p.height.toNumber()
      ) {
        tooltip.style.display = "block"
        tooltip.style.left = `${e.clientX - rect.left + 12}px`
        tooltip.style.top = `${e.clientY - rect.top - 10}px`
        tooltip.textContent = `${p.width}×${p.height}${p.rotated ? " (rotada)" : ""} | x:${p.x} y:${p.y}`
        found = true
        break
      }
    }
    if (!found) tooltip.style.display = "none"
  }

  function handleMouseLeave() {
    if (tooltipRef.current) tooltipRef.current.style.display = "none"
  }

  if (result.placements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        Sin resultados
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "absolute",
          background: "#1e293b",
          color: "#fff",
          fontSize: 10,
          padding: "3px 8px",
          borderRadius: 4,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      />
    </div>
  )
}
