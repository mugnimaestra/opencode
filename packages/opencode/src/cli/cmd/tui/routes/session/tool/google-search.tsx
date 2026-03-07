import { Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function GoogleSearch(props: ToolProps<any>) {
  const { theme } = useTheme()
  const input = props.input as any
  const metadata = props.metadata as any

  return (
    <CollapsibleTool
      part={props.part}
      icon="◉"
      pending="Searching..."
      summary={
        <>
          Google Search "{input.query}" <Show when={metadata.numResults}>({metadata.numResults} results)</Show>
        </>
      }
      title={`# Google Search "${input.query ?? ""}"`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No results</text>}>
        <Truncated text={props.output!} max={30} />
      </Show>
    </CollapsibleTool>
  )
}
