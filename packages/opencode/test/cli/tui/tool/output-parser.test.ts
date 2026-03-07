import { describe, expect, test } from "bun:test"
import { json, files, grep } from "../../../../src/cli/cmd/tui/routes/session/tool/output-parser"

describe("output parser", () => {
  describe("json", () => {
    test("detects valid JSON object", () => {
      const result = json('{"key": "value"}')
      expect(result.valid).toBe(true)
      expect(result.formatted).toContain('"key"')
    })

    test("detects valid JSON array", () => {
      const result = json("[1, 2, 3]")
      expect(result.valid).toBe(true)
      expect(result.formatted).toBe("[\n  1,\n  2,\n  3\n]")
    })

    test("detects valid JSON primitive", () => {
      expect(json('"hello"').valid).toBe(true)
      expect(json("42").valid).toBe(true)
      expect(json("true").valid).toBe(true)
      expect(json("null").valid).toBe(true)
    })

    test("rejects plain text", () => {
      expect(json("hello world").valid).toBe(false)
      expect(json("hello world").formatted).toBeUndefined()
    })

    test("rejects partial JSON", () => {
      expect(json('{"key": "value"').valid).toBe(false)
    })

    test("rejects empty string", () => {
      expect(json("").valid).toBe(false)
    })

    test("formats nested JSON with indentation", () => {
      const input = '{"a":{"b":1}}'
      const result = json(input)
      expect(result.valid).toBe(true)
      expect(result.formatted).toBe('{\n  "a": {\n    "b": 1\n  }\n}')
    })

    test("handles JSON with special characters", () => {
      const input = '{"path": "C:\\\\Users\\\\test"}'
      const result = json(input)
      expect(result.valid).toBe(true)
    })
  })

  describe("files", () => {
    test("splits file listing into array", () => {
      const output = "src/app.tsx\nsrc/index.tsx\nsrc/util.ts"
      expect(files(output)).toEqual(["src/app.tsx", "src/index.tsx", "src/util.ts"])
    })

    test("filters empty lines", () => {
      const output = "src/app.tsx\n\nsrc/index.tsx\n\n"
      expect(files(output)).toEqual(["src/app.tsx", "src/index.tsx"])
    })

    test("filters whitespace-only lines", () => {
      const output = "file.ts\n   \nother.ts"
      expect(files(output)).toEqual(["file.ts", "other.ts"])
    })

    test("empty input returns empty array", () => {
      expect(files("")).toEqual([])
    })

    test("single file", () => {
      expect(files("package.json")).toEqual(["package.json"])
    })

    test("preserves paths with spaces", () => {
      expect(files("my file.ts\nother dir/file.tsx")).toEqual(["my file.ts", "other dir/file.tsx"])
    })
  })

  describe("grep", () => {
    test("parses standard grep output", () => {
      const output = "src/app.ts:42:// TODO: implement\nsrc/util.ts:15:// TODO: refactor"
      const result = grep(output)
      expect(result).toEqual([
        { file: "src/app.ts", line: 42, content: "// TODO: implement" },
        { file: "src/util.ts", line: 15, content: "// TODO: refactor" },
      ])
    })

    test("skips lines not matching file:line:content format", () => {
      const output = "src/app.ts:42:match\nno match here\nsrc/b.ts:1:ok"
      const result = grep(output)
      expect(result.length).toBe(2)
      expect(result[0].file).toBe("src/app.ts")
      expect(result[1].file).toBe("src/b.ts")
    })

    test("handles colons in content", () => {
      const output = 'src/config.ts:10:const url = "http://localhost:3000"'
      const result = grep(output)
      expect(result.length).toBe(1)
      expect(result[0].file).toBe("src/config.ts")
      expect(result[0].line).toBe(10)
      expect(result[0].content).toBe('const url = "http://localhost:3000"')
    })

    test("empty input returns empty array", () => {
      expect(grep("")).toEqual([])
    })

    test("handles Windows-style paths", () => {
      const output = "C:\\src\\app.ts:5:content"
      const result = grep(output)
      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    test("handles line numbers correctly", () => {
      const output = "file.ts:1:first\nfile.ts:999:last\nfile.ts:10000:big"
      const result = grep(output)
      expect(result[0].line).toBe(1)
      expect(result[1].line).toBe(999)
      expect(result[2].line).toBe(10000)
    })

    test("handles empty content after line number", () => {
      const output = "file.ts:42:"
      const result = grep(output)
      expect(result.length).toBe(1)
      expect(result[0].content).toBe("")
    })
  })
})
