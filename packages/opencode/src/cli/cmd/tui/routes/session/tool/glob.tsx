import { createMemo, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { GlobTool } from "@/tool/glob"
import { normalizePath, type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function Glob(props: ToolProps<typeof GlobTool>) {
  const { theme } = useTheme()
  const count = createMemo(() => props.metadata.count)
  const suffix = createMemo(() => (count() === 1 ? "match" : "matches"))

  return (
    <CollapsibleTool
      part={props.part}
      icon="✱"
      pending="Finding files..."
      summary={
        <>
          Glob "{props.input.pattern}" <Show when={props.input.path}>in {normalizePath(props.input.path)} </Show>
          <Show when={count()}>
            ({count()} {suffix()})
          </Show>
        </>
      }
      title={`# Glob "${props.input.pattern ?? ""}" ${count() ? `(${count()} ${suffix()})` : ""}`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No output</text>}>
        <Truncated text={props.output!} max={30} />
      </Show>
    </CollapsibleTool>
  )
}
