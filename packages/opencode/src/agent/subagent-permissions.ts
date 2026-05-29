import { PermissionV1 } from "@opencode-ai/core/v1/permission"
import type { Permission } from "../permission"
import type { Agent } from "./agent"

/**
 * Build the `permission` ruleset for a subagent's session when it's spawned
 * via the task tool.
 *
 * Permission resolution is LAST-MATCH-WINS, and the subagent's runtime
 * ruleset is `Permission.merge(subagent.permission, derivedSessionPermission)`
 * — so any deny appended here lands LAST and would override the subagent's
 * own explicit allows. To respect self-declaration (#27654) while still
 * enforcing the Plan Mode ceiling for built-ins (#26514, #27201), we DO NOT
 * forward a parent `edit`/tool deny for any permission the subagent
 * explicitly `allow`s. Built-in `explore`/`general` subagents do not declare
 * `edit: allow`, so they still inherit the Plan Mode read-only ceiling.
 *
 * Combines:
 *
 * 1. The parent **agent's** `edit` deny rules — Plan Mode's file-edit
 *    restriction lives on the agent ruleset, not on the session, so a
 *    subagent that only inherited the parent SESSION's permission would
 *    silently bypass it (#26514, #27201). These are skipped entirely when
 *    the subagent explicitly allows `edit` (#27654).
 * 2. The parent **session's** `external_directory` rules (forwarded
 *    unconditionally) and generic deny rules (forwarded only when the
 *    subagent does not explicitly allow that same permission, #27654).
 * 3. Default `todowrite` and `task` denies if the subagent's own ruleset
 *    doesn't already permit them.
 */
export function deriveSubagentSessionPermission(input: {
  parentSessionPermission: PermissionV1.Ruleset
  parentAgent: Agent.Info | undefined
  subagent: Agent.Info
}): PermissionV1.Ruleset {
  const canTask = input.subagent.permission.some((rule) => rule.permission === "task")
  const canTodo = input.subagent.permission.some((rule) => rule.permission === "todowrite")
  const subagentAllowsEdit = input.subagent.permission.some(
    (rule) => rule.permission === "edit" && rule.action === "allow",
  )
  const subagentAllows = new Set(
    input.subagent.permission.filter((rule) => rule.action === "allow").map((rule) => rule.permission),
  )
  const parentAgentDenies = subagentAllowsEdit
    ? []
    : (input.parentAgent?.permission.filter((rule) => rule.action === "deny" && rule.permission === "edit") ?? [])
  return [
    ...parentAgentDenies,
    ...input.parentSessionPermission.filter(
      (rule) =>
        rule.permission === "external_directory" || (rule.action === "deny" && !subagentAllows.has(rule.permission)),
    ),
    ...(canTodo ? [] : [{ permission: "todowrite" as const, pattern: "*" as const, action: "deny" as const }]),
    ...(canTask ? [] : [{ permission: "task" as const, pattern: "*" as const, action: "deny" as const }]),
  ]
}
