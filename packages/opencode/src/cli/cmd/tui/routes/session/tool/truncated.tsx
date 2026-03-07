import { createMemo, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { JSX } from "@opentui/solid"
import { split, overflow, display, remaining } from "./truncate"
export { split, overflow, display, remaining }

// SolidJS component
export function Truncated(props: { text: string; max?: number; expanded?: boolean; children?: JSX.Element }) {
  const { theme } = useTheme()
  const max = () => props.max ?? 10
  const lines = createMemo(() => split(props.text))
  const hasOverflow = createMemo(() => overflow(lines(), max()))
  const content = createMemo(() => display(props.text, lines(), max(), props.expanded ?? false))
  const rest = createMemo(() => remaining(lines(), max()))

  return (
    <box gap={1}>
      <Show when={props.children} fallback={<text fg={theme.text}>{content()}</text>}>
        {props.children}
      </Show>
      <Show when={hasOverflow() && !props.expanded}>
        <text fg={theme.textMuted}>{rest()} more lines</text>
      </Show>
    </box>
  )
}
