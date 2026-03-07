import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"
import type { ToolPart } from "@opencode-ai/sdk/v2"
import type { RGBA } from "@opentui/core"
import type { JSX } from "@opentui/solid"
import { InlineTool, BlockTool } from "./shared"
import { register } from "./registry"

export function CollapsibleTool(props: {
  // Identity
  part: ToolPart

  // Collapsed view (InlineTool)
  icon: string
  iconColor?: RGBA
  pending: string
  summary: JSX.Element

  // Expanded view (BlockTool)
  title: string
  children: JSX.Element

  // Behavior
  auto?: boolean // auto-expand while running (default: false)
  error?: boolean // auto-expand on error (default: true)
  spinner?: boolean // show spinner in BlockTool title
}) {
  const [open, setOpen] = createSignal(false)

  const err = createMemo(() => {
    if (props.part.state.status !== "error") return false
    const msg = props.part.state.error
    return !(
      msg?.includes("rejected permission") ||
      msg?.includes("specified a rule") ||
      msg?.includes("user dismissed")
    )
  })

  const running = createMemo(() => props.part.state.status === "running")

  const expanded = createMemo(() => {
    if (open()) return true
    if (err() && props.error !== false) return true
    if (props.auto && running()) return true
    return false
  })

  const icon = createMemo(() => (err() ? "✗" : props.icon))
  const color = createMemo(() => (err() ? undefined : props.iconColor))

  onMount(() => {
    const cleanup = register(props.part.callID, () => setOpen((prev) => !prev))
    onCleanup(cleanup)
  })

  return (
    <Show
      when={expanded()}
      fallback={
        <InlineTool
          icon={icon()}
          iconColor={color()}
          pending={props.pending}
          complete={true}
          part={props.part}
          onClick={() => setOpen(true)}
        >
          {props.summary}
        </InlineTool>
      }
    >
      <BlockTool
        title={props.title}
        part={props.part}
        spinner={props.spinner ?? running()}
        onClick={() => setOpen(false)}
      >
        {props.children}
      </BlockTool>
    </Show>
  )
}
