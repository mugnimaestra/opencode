import { Jimp } from "jimp"

export async function resize(data: Buffer, limit: number): Promise<{ data: Buffer; mime: string } | undefined> {
  if (data.byteLength <= limit) return undefined

  try {
    const img = await Jimp.read(data)

    // try JPEG quality reduction at original dimensions
    for (const quality of [85, 70, 50, 30]) {
      const buf = await img.getBuffer("image/jpeg", { quality })
      if (buf.byteLength <= limit) return { data: buf, mime: "image/jpeg" }
    }

    // reduce dimensions progressively
    for (const factor of [0.75, 0.5, 0.25]) {
      const w = Math.round(img.width * factor)
      const h = Math.round(img.height * factor)
      if (w < 1 || h < 1) continue
      const resized = img.clone().resize({ w, h })
      const buf = await resized.getBuffer("image/jpeg", { quality: 50 })
      if (buf.byteLength <= limit) return { data: buf, mime: "image/jpeg" }
    }

    return undefined
  } catch {
    return undefined
  }
}
