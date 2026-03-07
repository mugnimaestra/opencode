const BUILTIN = new Set([
  "bash",
  "read",
  "write",
  "edit",
  "glob",
  "grep",
  "list",
  "webfetch",
  "codesearch",
  "websearch",
  "task",
  "apply_patch",
  "todowrite",
  "todoread",
  "question",
  "skill",
  "batch",
  "plan_exit",
  "lsp",
  "invalid",
  "multiedit",
])

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_")
}

export function parse(name: string, servers: Record<string, unknown>): { server: string; tool: string } | undefined {
  for (const server of Object.keys(servers)) {
    const prefix = sanitize(server) + "_"
    if (name.startsWith(prefix) && name.length > prefix.length) {
      return { server, tool: name.slice(prefix.length) }
    }
  }
  return undefined
}

export function isMcp(name: string, servers: Record<string, unknown>): boolean {
  if (BUILTIN.has(name)) return false
  return parse(name, servers) !== undefined
}
