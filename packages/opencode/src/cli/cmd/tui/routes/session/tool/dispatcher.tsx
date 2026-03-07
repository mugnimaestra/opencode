import { createMemo, Match, Show, Switch } from "solid-js"
import { useSync } from "@tui/context/sync"
import type { AssistantMessage, ToolPart } from "@opencode-ai/sdk/v2"
import { use } from "../context"
import { Bash } from "./bash"
import { Write } from "./write"
import { Edit } from "./edit"
import { Glob } from "./glob"
import { Read } from "./read"
import { Grep } from "./grep"
import { WebFetch } from "./webfetch"
import { CodeSearch } from "./codesearch"
import { WebSearch } from "./websearch"
import { GoogleSearch } from "./google-search"
import { Task } from "./task"
import { ApplyPatch } from "./apply-patch"
import { TodoWrite } from "./todowrite"
import { Question } from "./question"
import { Skill } from "./skill"
import { GenericTool } from "./generic"
import { McpTool, isMcp } from "./mcp"

export function ToolPartDispatcher(props: { last: boolean; part: ToolPart; message: AssistantMessage }) {
  const ctx = use()
  const sync = useSync()

  const shouldHide = createMemo(() => {
    if (ctx.showDetails()) return false
    if (props.part.state.status !== "completed") return false
    return true
  })

  const toolprops = {
    get metadata() {
      return props.part.state.status === "pending" ? {} : (props.part.state.metadata ?? {})
    },
    get input() {
      return props.part.state.input ?? {}
    },
    get output() {
      return props.part.state.status === "completed" ? props.part.state.output : undefined
    },
    get permission() {
      const permissions = sync.data.permission[props.message.sessionID] ?? []
      const permissionIndex = permissions.findIndex((x) => x.tool?.callID === props.part.callID)
      return permissions[permissionIndex]
    },
    get tool() {
      return props.part.tool
    },
    get part() {
      return props.part
    },
  }

  return (
    <Show when={!shouldHide()}>
      <box id={`tool-${props.part.callID}`}>
        <Switch>
          <Match when={props.part.tool === "bash"}>
            <Bash {...toolprops} />
          </Match>
          <Match when={props.part.tool === "glob"}>
            <Glob {...toolprops} />
          </Match>
          <Match when={props.part.tool === "read"}>
            <Read {...toolprops} />
          </Match>
          <Match when={props.part.tool === "grep"}>
            <Grep {...toolprops} />
          </Match>
          <Match when={props.part.tool === "webfetch"}>
            <WebFetch {...toolprops} />
          </Match>
          <Match when={props.part.tool === "codesearch"}>
            <CodeSearch {...toolprops} />
          </Match>
          <Match when={props.part.tool === "websearch"}>
            <WebSearch {...toolprops} />
          </Match>
          <Match when={props.part.tool === "google_search"}>
            <GoogleSearch {...toolprops} />
          </Match>
          <Match when={props.part.tool === "write"}>
            <Write {...toolprops} />
          </Match>
          <Match when={props.part.tool === "edit"}>
            <Edit {...toolprops} />
          </Match>
          <Match when={props.part.tool === "task"}>
            <Task {...toolprops} />
          </Match>
          <Match when={props.part.tool === "apply_patch"}>
            <ApplyPatch {...toolprops} />
          </Match>
          <Match when={props.part.tool === "todowrite"}>
            <TodoWrite {...toolprops} />
          </Match>
          <Match when={props.part.tool === "question"}>
            <Question {...toolprops} />
          </Match>
          <Match when={props.part.tool === "skill"}>
            <Skill {...toolprops} />
          </Match>
          <Match when={isMcp(props.part.tool, sync.data.mcp)}>
            <McpTool {...toolprops} />
          </Match>
          <Match when={true}>
            <GenericTool {...toolprops} />
          </Match>
        </Switch>
      </box>
    </Show>
  )
}
