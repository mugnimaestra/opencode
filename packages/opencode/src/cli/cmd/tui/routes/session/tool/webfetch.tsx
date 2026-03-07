import { Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { WebFetchTool } from "@/tool/webfetch"
import { type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function WebFetch(props: ToolProps<typeof WebFetchTool>) {
  const { theme } = useTheme()
  const url = () => (props.input as any).url

  return (
    <CollapsibleTool
      part={props.part}
      icon="%"
      pending="Fetching from the web..."
      summary={<>WebFetch {url()}</>}
      title={`# WebFetch ${url() ?? ""}`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No content</text>}>
        <Truncated text={props.output!} max={20} />
      </Show>
    </CollapsibleTool>
  )
}
