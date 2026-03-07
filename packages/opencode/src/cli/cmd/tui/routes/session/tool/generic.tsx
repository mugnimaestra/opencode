import { createMemo, createSignal, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { BlockTool, InlineTool, input, type ToolProps } from "./shared"
import { use } from "../context"
import { split, overflow, display } from "./truncated"

export function GenericTool(props: ToolProps<any>) {
  const { theme } = useTheme()
  const ctx = use()
  const output = createMemo(() => props.output?.trim() ?? "")
  const [expanded, setExpanded] = createSignal(false)
  const lines = createMemo(() => split(output()))
  const hasOverflow = createMemo(() => overflow(lines(), 3))
  const limited = createMemo(() => display(output(), lines(), 3, expanded()))

  return (
    <Show
      when={props.output && ctx.showGenericToolOutput()}
      fallback={
        <InlineTool icon="⚙" pending="Writing command..." complete={true} part={props.part}>
          {props.tool} {input(props.input)}
        </InlineTool>
      }
    >
      <BlockTool
        title={`# ${props.tool} ${input(props.input)}`}
        part={props.part}
        onClick={hasOverflow() ? () => setExpanded((prev) => !prev) : undefined}
      >
        <box gap={1}>
          <text fg={theme.text}>{limited()}</text>
          <Show when={hasOverflow()}>
            <text fg={theme.textMuted}>{expanded() ? "Click to collapse" : "Click to expand"}</text>
          </Show>
        </box>
      </BlockTool>
    </Show>
  )
}
