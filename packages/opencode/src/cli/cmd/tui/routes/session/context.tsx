import { createContext, useContext } from "solid-js"
import type { Provider } from "@opencode-ai/sdk/v2"
import type { useSync } from "@tui/context/sync"
import type { useTuiConfig } from "../../context/tui-config"

export const SessionContext = createContext<{
  width: number
  sessionID: string
  conceal: () => boolean
  thinkingMode: () => "hide" | "minimal" | "full"
  showThinking: () => boolean
  showTimestamps: () => boolean
  showDetails: () => boolean
  showGenericToolOutput: () => boolean
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
