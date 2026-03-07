import { describe, expect, test } from "bun:test"
import { denied, autoExpand, duration } from "../../../../src/cli/cmd/tui/routes/session/tool/helpers"
import { completed, errored, running, pending } from "./fixture"

describe("error visibility", () => {
  describe("denied", () => {
    test("returns false for undefined", () => {
      expect(denied(undefined)).toBe(false)
    })

    test("returns false for empty string", () => {
      expect(denied("")).toBe(false)
    })

    test("returns false for generic error", () => {
      expect(denied("Command failed with exit code 1")).toBe(false)
    })

    test("returns true for rejected permission", () => {
      expect(denied("The user rejected permission for this tool call")).toBe(true)
    })

    test("returns true for specified a rule", () => {
      expect(denied("The user specified a rule that denied this action")).toBe(true)
    })

    test("returns true for user dismissed", () => {
      expect(denied("The user dismissed the permission prompt")).toBe(true)
    })

    test("returns true when denial substring is embedded in longer message", () => {
      expect(denied("Error: user rejected permission — retrying")).toBe(true)
    })

    test("case sensitive — wrong case returns false", () => {
      expect(denied("REJECTED PERMISSION")).toBe(false)
    })
  })

  describe("autoExpand", () => {
    test("completed tool does not auto-expand", () => {
      expect(autoExpand(completed())).toBe(false)
    })

    test("pending tool does not auto-expand", () => {
      expect(autoExpand(pending())).toBe(false)
    })

    test("running tool does not auto-expand by default", () => {
      expect(autoExpand(running())).toBe(false)
    })

    test("running tool auto-expands with auto option", () => {
      expect(autoExpand(running(), { auto: true })).toBe(true)
    })

    test("error auto-expands by default", () => {
      expect(autoExpand(errored())).toBe(true)
    })

    test("error does NOT auto-expand when opts.error is false", () => {
      expect(autoExpand(errored(), { error: false })).toBe(false)
    })

    test("permission denied does NOT auto-expand", () => {
      const part = errored({ error: "The user rejected permission for bash" })
      expect(autoExpand(part)).toBe(false)
    })

    test("permission denied with 'specified a rule' does NOT auto-expand", () => {
      const part = errored({ error: "The user specified a rule blocking write" })
      expect(autoExpand(part)).toBe(false)
    })

    test("permission denied with 'user dismissed' does NOT auto-expand", () => {
      const part = errored({ error: "The user dismissed the permission prompt" })
      expect(autoExpand(part)).toBe(false)
    })

    test("real error always auto-expands regardless of auto option", () => {
      expect(autoExpand(errored(), { auto: false })).toBe(true)
    })
  })

  describe("duration", () => {
    test("completed tool returns milliseconds", () => {
      const part = completed({ time: { start: 1000, end: 5000 } })
      expect(duration(part)).toBe(4000)
    })

    test("error tool returns milliseconds", () => {
      const part = errored({ time: { start: 0, end: 500 } })
      expect(duration(part)).toBe(500)
    })

    test("running tool returns undefined", () => {
      expect(duration(running())).toBeUndefined()
    })

    test("pending tool returns undefined", () => {
      expect(duration(pending())).toBeUndefined()
    })

    test("zero duration when start equals end", () => {
      const part = completed({ time: { start: 1000, end: 1000 } })
      expect(duration(part)).toBe(0)
    })

    test("long duration is computed correctly", () => {
      const part = completed({ time: { start: 0, end: 120000 } })
      expect(duration(part)).toBe(120000)
    })
  })
})
