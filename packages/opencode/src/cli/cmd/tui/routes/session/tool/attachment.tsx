import { For, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { FilePart } from "@opencode-ai/sdk/v2"
import { icon, label } from "./mime"

export { MIME_ICON, FALLBACK_ICON, icon, label } from "./mime"

export function Attachments(props: { parts?: FilePart[] }) {
  const { theme } = useTheme()
  return (
    <Show when={props.parts?.length}>
      <box marginTop={1}>
        <text fg={theme.textMuted}>Attachments:</text>
        <For each={props.parts}>
          {(file) => (
            <text fg={theme.text}>
              {icon(file.mime)} {label(file.filename)} ({file.mime})
            </text>
          )}
        </For>
      </box>
    </Show>
  )
}
