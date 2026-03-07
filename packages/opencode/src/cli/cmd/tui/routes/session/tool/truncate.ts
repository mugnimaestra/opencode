// Pure functions — no SolidJS, fully testable
export function split(text: string): string[] {
  return text.split("\n")
}

export function overflow(lines: string[], max: number): boolean {
  return lines.length > max
}

export function display(text: string, lines: string[], max: number, expanded: boolean): string {
  if (expanded || lines.length <= max) return text
  return [...lines.slice(0, max), "…"].join("\n")
}

export function remaining(lines: string[], max: number): number {
  return lines.length - max
}
