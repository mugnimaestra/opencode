import { describe, expect, test, beforeEach } from "bun:test"
import { register, toggle, ids, clear, size, toggleAll } from "../../../../src/cli/cmd/tui/routes/session/tool/registry"

describe("toggle registry", () => {
  beforeEach(() => {
    clear()
  })

  describe("register", () => {
    test("adds entry to registry", () => {
      register("call_1", () => {})
      expect(size()).toBe(1)
      expect(ids()).toContain("call_1")
    })

    test("multiple registrations", () => {
      register("call_1", () => {})
      register("call_2", () => {})
      register("call_3", () => {})
      expect(size()).toBe(3)
    })

    test("overwrites existing entry with same id", () => {
      let count = 0
      register("call_1", () => {
        count = 1
      })
      register("call_1", () => {
        count = 2
      })
      expect(size()).toBe(1)
      toggle("call_1")
      expect(count).toBe(2)
    })

    test("returns cleanup function", () => {
      const cleanup = register("call_1", () => {})
      expect(typeof cleanup).toBe("function")
    })

    test("cleanup removes entry", () => {
      const cleanup = register("call_1", () => {})
      expect(size()).toBe(1)
      cleanup()
      expect(size()).toBe(0)
      expect(ids()).not.toContain("call_1")
    })

    test("cleanup only removes its own entry", () => {
      const cleanup1 = register("call_1", () => {})
      register("call_2", () => {})
      cleanup1()
      expect(size()).toBe(1)
      expect(ids()).toContain("call_2")
      expect(ids()).not.toContain("call_1")
    })

    test("double cleanup is safe", () => {
      const cleanup = register("call_1", () => {})
      cleanup()
      cleanup()
      expect(size()).toBe(0)
    })
  })

  describe("toggle", () => {
    test("calls registered function", () => {
      let called = false
      register("call_1", () => {
        called = true
      })
      toggle("call_1")
      expect(called).toBe(true)
    })

    test("does nothing for unregistered id", () => {
      // Should not throw
      toggle("nonexistent")
    })

    test("calls correct function when multiple registered", () => {
      const calls: string[] = []
      register("call_1", () => calls.push("first"))
      register("call_2", () => calls.push("second"))
      toggle("call_2")
      expect(calls).toEqual(["second"])
    })

    test("can be called multiple times", () => {
      let count = 0
      register("call_1", () => {
        count++
      })
      toggle("call_1")
      toggle("call_1")
      toggle("call_1")
      expect(count).toBe(3)
    })

    test("does nothing after cleanup", () => {
      let called = false
      const cleanup = register("call_1", () => {
        called = true
      })
      cleanup()
      toggle("call_1")
      expect(called).toBe(false)
    })
  })

  describe("ids", () => {
    test("returns empty array when empty", () => {
      expect(ids()).toEqual([])
    })

    test("returns all registered ids", () => {
      register("a", () => {})
      register("b", () => {})
      register("c", () => {})
      const result = ids()
      expect(result).toContain("a")
      expect(result).toContain("b")
      expect(result).toContain("c")
      expect(result.length).toBe(3)
    })
  })

  describe("clear", () => {
    test("removes all entries", () => {
      register("call_1", () => {})
      register("call_2", () => {})
      clear()
      expect(size()).toBe(0)
      expect(ids()).toEqual([])
    })

    test("clear on empty is safe", () => {
      clear()
      expect(size()).toBe(0)
    })
  })

  describe("toggleAll", () => {
    test("calls function for each registered id", () => {
      const toggled: string[] = []
      register("call_1", () => {})
      register("call_2", () => {})
      register("call_3", () => {})
      toggleAll((id) => toggled.push(id))
      expect(toggled.length).toBe(3)
      expect(toggled).toContain("call_1")
      expect(toggled).toContain("call_2")
      expect(toggled).toContain("call_3")
    })

    test("does nothing when registry is empty", () => {
      const toggled: string[] = []
      toggleAll((id) => toggled.push(id))
      expect(toggled).toEqual([])
    })
  })

  describe("integration", () => {
    test("simulates expand_all / collapse_all cycle", () => {
      const states = new Map<string, boolean>()
      register("call_1", () => states.set("call_1", !states.get("call_1")))
      register("call_2", () => states.set("call_2", !states.get("call_2")))

      // expand_all: toggle each
      toggleAll((id) => toggle(id))
      expect(states.get("call_1")).toBe(true)
      expect(states.get("call_2")).toBe(true)

      // collapse_all: toggle each again
      toggleAll((id) => toggle(id))
      expect(states.get("call_1")).toBe(false)
      expect(states.get("call_2")).toBe(false)
    })

    test("register then toggle then cleanup then toggle is safe", () => {
      let count = 0
      const cleanup = register("call_1", () => {
        count++
      })
      toggle("call_1")
      expect(count).toBe(1)
      cleanup()
      toggle("call_1")
      expect(count).toBe(1) // no increment after cleanup
    })
  })
})
