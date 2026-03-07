import { Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { useSync } from "@tui/context/sync"
import { type ToolProps, input } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"
import { parse } from "./mcp-parse"
export { isMcp, parse } from "./mcp-parse"

export function McpTool(props: ToolProps<any>) {
  const { theme } = useTheme()
  const sync = useSync()
  const parsed = () => parse(props.tool, sync.data.mcp)

  const server = () => parsed()?.server ?? ""
  const tool = () => parsed()?.tool ?? props.tool

  return (
    <CollapsibleTool
      part={props.part}
      icon="⬡"
      pending={`Calling ${tool()}...`}
      summary={
        <>
          <Show when={server()}>
            <span style={{ bold: true }}>{server()}</span>:{" "}
          </Show>
          {tool()} {input(props.input)}
        </>
      }
      title={`# ${server() ? server() + " → " : ""}${tool()}`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No output</text>}>
        <Truncated text={props.output!} max={20} />
      </Show>
    </CollapsibleTool>
  )
}
