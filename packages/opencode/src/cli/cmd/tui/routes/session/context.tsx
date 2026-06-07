import { createContext, useContext } from "solid-js"
import type { Provider } from "@opencode-ai/sdk/v2"
import type { useSync } from "@tui/context/sync"
import type { useTuiConfig } from "../../context/tui-config"
import type { ThinkingMode } from "../../context/thinking"

export const SessionContext = createContext<{
  width: number
  sessionID: string
  conceal: () => boolean
  thinkingMode: () => ThinkingMode
  showThinking: () => boolean
  showTimestamps: () => boolean
  showDetails: () => boolean
  showGenericToolOutput: () => boolean
  userMessageIDs: () => ReadonlySet<string>
  diffWrapMode: () => "word" | "none"
  providers: () => ReadonlyMap<string, Provider>
  sync: ReturnType<typeof useSync>
  tui: ReturnType<typeof useTuiConfig>
}>()

export function use() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useContext must be used within a Session component")
  return ctx
}
