import { createMemo, For, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { ReadTool } from "@/tool/read"
import { normalizePath, input, type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function Read(props: ToolProps<typeof ReadTool>) {
  const { theme } = useTheme()
  const loaded = createMemo(() => {
    if (props.part.state.status !== "completed") return []
    if (props.part.state.time.compacted) return []
    const value = props.metadata.loaded
    if (!value || !Array.isArray(value)) return []
    return value.filter((p): p is string => typeof p === "string")
  })

  return (
    <>
      <CollapsibleTool
        part={props.part}
        icon="→"
        pending="Reading file..."
        spinner={props.part.state.status === "running"}
        summary={
          <>
            Read {normalizePath(props.input.filePath!)} {input(props.input, ["filePath"])}
          </>
        }
        title={`# Read ${normalizePath(props.input.filePath!)}`}
      >
        <Show when={props.output} fallback={<text fg={theme.textMuted}>No content</text>}>
          <Truncated text={props.output!} max={20} />
        </Show>
      </CollapsibleTool>
      <For each={loaded()}>
        {(filepath) => (
          <box paddingLeft={3}>
            <text paddingLeft={3} fg={theme.textMuted}>
              ↳ Loaded {normalizePath(filepath)}
            </text>
          </box>
        )}
      </For>
    </>
  )
}
