import { createMemo, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { GrepTool } from "@/tool/grep"
import { normalizePath, type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function Grep(props: ToolProps<typeof GrepTool>) {
  const { theme } = useTheme()
  const count = createMemo(() => props.metadata.matches)
  const suffix = createMemo(() => (count() === 1 ? "match" : "matches"))

  return (
    <CollapsibleTool
      part={props.part}
      icon="✱"
      pending="Searching content..."
      summary={
        <>
          Grep "{props.input.pattern}" <Show when={props.input.path}>in {normalizePath(props.input.path)} </Show>
          <Show when={count()}>
            ({count()} {suffix()})
          </Show>
        </>
      }
      title={`# Grep "${props.input.pattern ?? ""}" ${count() ? `(${count()} ${suffix()})` : ""}`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No output</text>}>
        <Truncated text={props.output!} max={30} />
      </Show>
    </CollapsibleTool>
  )
}
