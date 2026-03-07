import { describe, expect, test } from "bun:test"
import { MIME_ICON, FALLBACK_ICON, icon, label } from "../../../../src/cli/cmd/tui/routes/session/tool/mime"

describe("attachment", () => {
  describe("icon", () => {
    test("image/png → 🖼", () => {
      expect(icon("image/png")).toBe("🖼")
    })

    test("image/jpeg → 🖼", () => {
      expect(icon("image/jpeg")).toBe("🖼")
    })

    test("image/gif → 🖼", () => {
      expect(icon("image/gif")).toBe("🖼")
    })

    test("image/webp → 🖼", () => {
      expect(icon("image/webp")).toBe("🖼")
    })

    test("application/pdf → 📄", () => {
      expect(icon("application/pdf")).toBe("📄")
    })

    test("text/plain → 📝", () => {
      expect(icon("text/plain")).toBe("📝")
    })

    test("unknown MIME returns fallback 📎", () => {
      expect(icon("application/octet-stream")).toBe("📎")
    })

    test("empty string returns fallback", () => {
      expect(icon("")).toBe("📎")
    })

    test("completely unknown type returns fallback", () => {
      expect(icon("video/mp4")).toBe("📎")
      expect(icon("audio/mpeg")).toBe("📎")
      expect(icon("font/woff2")).toBe("📎")
    })
  })

  describe("label", () => {
    test("returns filename when provided", () => {
      expect(label("screenshot.png")).toBe("screenshot.png")
    })

    test("returns 'unnamed' when undefined", () => {
      expect(label(undefined)).toBe("unnamed")
    })

    test("returns 'unnamed' when not provided", () => {
      expect(label()).toBe("unnamed")
    })

    test("preserves paths in filename", () => {
      expect(label("screenshots/test.png")).toBe("screenshots/test.png")
    })

    test("preserves empty string filename", () => {
      expect(label("")).toBe("")
    })
  })

  describe("MIME_ICON coverage", () => {
    test("all image types map to 🖼", () => {
      const images = Object.entries(MIME_ICON).filter(([_, v]) => v === "🖼")
      expect(images.length).toBeGreaterThanOrEqual(4)
      for (const [mime] of images) {
        expect(mime.startsWith("image/")).toBe(true)
      }
    })

    test("FALLBACK_ICON is 📎", () => {
      expect(FALLBACK_ICON).toBe("📎")
    })
  })
})
