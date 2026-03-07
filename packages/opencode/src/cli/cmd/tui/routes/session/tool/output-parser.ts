export function json(text: string): { valid: boolean; formatted?: string } {
  try {
    const parsed = JSON.parse(text)
    return { valid: true, formatted: JSON.stringify(parsed, null, 2) }
  } catch {
    return { valid: false }
  }
}

export function files(text: string): string[] {
  return text.split("\n").filter((line) => line.trim().length > 0)
}

export function grep(text: string): Array<{ file: string; line: number; content: string }> {
  const results: Array<{ file: string; line: number; content: string }> = []
  for (const row of text.split("\n")) {
    const match = row.match(/^(.+?):(\d+):(.*)$/)
    if (!match) continue
    results.push({ file: match[1], line: parseInt(match[2], 10), content: match[3] })
  }
  return results
}
