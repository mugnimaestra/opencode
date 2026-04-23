import { Jimp } from "jimp"

// Claude's native image resolution for non-Opus-4.7 models — images larger than
// this are downscaled server-side anyway, and it stays under the 2000px
// many-image cap that triggers "max allowed size for many-image requests".
export const CLAUDE_SAFE_DIMENSION = 1568

export async function resize(
  data: Buffer,
  opts: { maxBytes?: number; maxDimension?: number },
): Promise<{ data: Buffer; mime: string } | undefined> {
  const { maxBytes, maxDimension } = opts
  const overBytes = maxBytes !== undefined && data.byteLength > maxBytes
  if (!overBytes && maxDimension === undefined) return undefined

  try {
    const img = await Jimp.read(data)
    const overDim = maxDimension !== undefined && (img.width > maxDimension || img.height > maxDimension)
    if (!overBytes && !overDim) return undefined

    if (overDim) {
      const scale = maxDimension! / Math.max(img.width, img.height)
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      img.resize({ w, h })
    }

    if (maxBytes === undefined) {
      const buf = await img.getBuffer("image/jpeg", { quality: 90 })
      return { data: buf, mime: "image/jpeg" }
    }

    // try JPEG quality reduction at current dimensions
    for (const quality of [85, 70, 50, 30]) {
      const buf = await img.getBuffer("image/jpeg", { quality })
      if (buf.byteLength <= maxBytes) return { data: buf, mime: "image/jpeg" }
    }

    // reduce dimensions progressively
    for (const factor of [0.75, 0.5, 0.25]) {
      const w = Math.round(img.width * factor)
      const h = Math.round(img.height * factor)
      if (w < 1 || h < 1) continue
      const resized = img.clone().resize({ w, h })
      const buf = await resized.getBuffer("image/jpeg", { quality: 50 })
      if (buf.byteLength <= maxBytes) return { data: buf, mime: "image/jpeg" }
    }

    return undefined
  } catch {
    return undefined
  }
}
