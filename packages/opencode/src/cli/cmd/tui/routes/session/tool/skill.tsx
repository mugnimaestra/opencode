import { Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import type { SkillTool } from "@/tool/skill"
import { type ToolProps } from "./shared"
import { CollapsibleTool } from "./collapsible"
import { Truncated } from "./truncated"

export function Skill(props: ToolProps<typeof SkillTool>) {
  const { theme } = useTheme()

  return (
    <CollapsibleTool
      part={props.part}
      icon="→"
      pending="Loading skill..."
      summary={<>Skill "{props.input.name}"</>}
      title={`# Skill "${props.input.name ?? ""}"`}
    >
      <Show when={props.output} fallback={<text fg={theme.textMuted}>No output</text>}>
        <Truncated text={props.output!} max={20} />
      </Show>
    </CollapsibleTool>
  )
}
