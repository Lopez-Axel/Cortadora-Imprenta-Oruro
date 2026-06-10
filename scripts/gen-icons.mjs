import { createCanvas } from "canvas"
import { writeFileSync } from "fs"

for (const size of [192, 512]) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1E40AF"
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = "#B2FFFF"
  ctx.font = `bold ${size * 0.35}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("✂", size / 2, size / 2)

  writeFileSync(`public/icon-${size}.png`, canvas.toBuffer("image/png"))
  console.log(`icon-${size}.png generado`)
}
