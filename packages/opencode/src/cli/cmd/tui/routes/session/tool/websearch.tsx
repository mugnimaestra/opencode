import { Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function WebSearch(props: ToolProps<any>) {
  const { theme } = useTheme()
  const input = props.input as any
  const metadata = props.metadata as any

  return (
    <CollapsibleTool
      part={props.part}
      icon="◈"
      pending="Searching web..."
      summary={
        <>
          Exa Web Search "{input.query}" <Show when={metadata.numResults}>({metadata.numResults} results)</Show>
        </>
      }
      title={`# Web Search "${input.query ?? ""}"`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No results</text>}>
        <Truncated text={props.output!} max={30} />
      </Show>
    </CollapsibleTool>
  )
}
