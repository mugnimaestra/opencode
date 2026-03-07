import { describe, expect, test } from "bun:test"
import { split, overflow, display, remaining } from "../../../../src/cli/cmd/tui/routes/session/tool/truncate"

describe("truncated", () => {
  describe("split", () => {
    test("splits text into lines", () => {
      expect(split("a\nb\nc")).toEqual(["a", "b", "c"])
    })

    test("single line returns array of one", () => {
      expect(split("hello")).toEqual(["hello"])
    })

    test("empty string returns array with one empty string", () => {
      expect(split("")).toEqual([""])
    })

    test("trailing newline creates empty last element", () => {
      expect(split("a\nb\n")).toEqual(["a", "b", ""])
    })
  })

  describe("overflow", () => {
    test("returns false when lines fit", () => {
      expect(overflow(["a", "b", "c"], 10)).toBe(false)
    })

    test("returns false at exact limit", () => {
      expect(overflow(["a", "b", "c"], 3)).toBe(false)
    })

    test("returns true when lines exceed limit", () => {
      expect(overflow(["a", "b", "c", "d"], 3)).toBe(true)
    })

    test("returns true for large input", () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `line${i}`)
      expect(overflow(lines, 10)).toBe(true)
    })
  })

  describe("display", () => {
    const text = "line0\nline1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9"
    const lines = text.split("\n")

    test("returns full text when expanded", () => {
      expect(display(text, lines, 3, true)).toBe(text)
    })

    test("returns full text when under limit", () => {
      expect(display(text, lines, 100, false)).toBe(text)
    })

    test("truncates with ellipsis when collapsed and overflow", () => {
      const result = display(text, lines, 3, false)
      expect(result).toBe("line0\nline1\nline2\n…")
    })

    test("truncates at limit 1", () => {
      const result = display(text, lines, 1, false)
      expect(result).toBe("line0\n…")
    })

    test("preserves exact text when at limit", () => {
      const exact = "a\nb\nc"
      expect(display(exact, exact.split("\n"), 3, false)).toBe(exact)
    })
  })

  describe("remaining", () => {
    test("returns difference between lines and max", () => {
      const lines = Array.from({ length: 15 }, (_, i) => `line${i}`)
      expect(remaining(lines, 10)).toBe(5)
    })

    test("returns zero when at limit", () => {
      expect(remaining(["a", "b", "c"], 3)).toBe(0)
    })

    test("returns negative when under limit", () => {
      expect(remaining(["a"], 10)).toBe(-9)
    })
  })

  describe("integration", () => {
    test("bash default: 10 line limit", () => {
      const max = 10
      const lines = Array.from({ length: 25 }, (_, i) => `$ output line ${i}`)
      const text = lines.join("\n")
      const s = text.split("\n")

      expect(overflow(s, max)).toBe(true)
      expect(remaining(s, max)).toBe(15)

      const collapsed = display(text, s, max, false)
      expect(collapsed.split("\n").length).toBe(11) // 10 lines + "…"
      expect(collapsed.endsWith("…")).toBe(true)

      const expanded = display(text, s, max, true)
      expect(expanded).toBe(text)
    })

    test("generic tool default: 3 line limit", () => {
      const max = 3
      const text = "first\nsecond\nthird\nfourth\nfifth"
      const s = text.split("\n")

      expect(overflow(s, max)).toBe(true)
      const result = display(text, s, max, false)
      expect(result).toBe("first\nsecond\nthird\n…")
    })

    test("empty output is never truncated", () => {
      const text = ""
      const lines = text.split("\n")
      expect(overflow(lines, 10)).toBe(false)
      expect(display(text, lines, 10, false)).toBe("")
    })
  })
})
